'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import {
  User,
  Users,
  CreditCard,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Upload,
  Calendar,
  Lock,
  X
} from 'lucide-react';
import { getStates, getLgasForState } from '@/lib/nigeria-locations';

interface OnboardingWidgetProps {
  summary: any;
  onRefresh: () => void;
  initialStep?: number;
  onClose?: () => void;
}

export default function OnboardingWidget({ summary, onRefresh, initialStep, onClose }: OnboardingWidgetProps) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Keep track of the step synced from the server.
  // We only reset activeStep when the server reports a change in progress
  // (e.g. after a successful save), while preserving manual client-side
  // navigation back/forward in between updates.
  const lastSyncedStepRef = React.useRef<number | null>(null);

  const [selectedFiles, setSelectedFiles] = useState<{
    idDocument: File | null;
    selfie: File | null;
    proofOfAddress: File | null;
  }>({
    idDocument: null,
    selfie: null,
    proofOfAddress: null,
  });

  // States list from locations helper
  const statesList = getStates();

  // Form states mapping Step 1, 2, 3, 4, 5
  const [formData, setFormData] = useState({
    // Prefilled (Stage 1 / User)
    firstName: '',
    lastName: '',
    email: '',
    phone: '',

    // Step 1: Personal Info
    gender: '',
    dob: '',
    country: 'Nigeria',
    state: '',
    stateOfOrigin: '',
    lga: '',
    city: '',
    address: '',

    // Step 2: Next of Kin
    nextOfKinName: '',
    nextOfKinPhone: '',
    relationship: '',
    nextOfKinAddress: '',

    // Step 3: Bank Details
    bankName: '',
    accountNumber: '',
    accountName: '',

    // Step 4: Identity Verification
    idType: 'NIN',
    idNumber: '',
    idDocument: '',
    selfie: '',
    proofOfAddress: '',

    // Step 5: Activation Code
    code: '',
  });

  // Dynamically filter LGAs for the selected State in Step 1
  const lgas = React.useMemo(() => getLgasForState(formData.state), [formData.state]);
  const statesOfOriginLgas = React.useMemo(() => getLgasForState(formData.stateOfOrigin), [formData.stateOfOrigin]); // If they choose state of origin

  // Prefill details from summary on mount and after refresh
  useEffect(() => {
    if (summary) {
      const parts = (summary.name || '').split(' ');
      const fName = parts[0] || '';
      const lName = parts.slice(1).join(' ') || '';

      setFormData((prev) => ({
        ...prev,
        firstName: summary.profile?.firstName || fName,
        lastName: summary.profile?.lastName || lName,
        email: summary.email || '',
        phone: summary.profile?.phone || summary.phone || '',
        gender: summary.profile?.gender || '',
        dob: summary.profile?.dob ? new Date(summary.profile.dob).toISOString().split('T')[0] : '',
        country: summary.profile?.country || 'Nigeria',
        state: summary.profile?.state || '',
        stateOfOrigin: summary.profile?.stateOfOrigin || '',
        lga: summary.profile?.lga || '',
        city: summary.profile?.city || '',
        address: summary.profile?.address || '',
        nextOfKinName: summary.profile?.nextOfKinName || '',
        nextOfKinPhone: summary.profile?.nextOfKinPhone || '',
        relationship: summary.profile?.relationship || '',
        nextOfKinAddress: summary.profile?.nextOfKinAddress || '',
        bankName: summary.bankName || '',
        accountNumber: summary.accountNumber || '',
        accountName: summary.accountName || '',
        idDocument: summary.kycSubmission?.idDocument || '',
        selfie: summary.kycSubmission?.selfie || '',
        proofOfAddress: summary.kycSubmission?.proofOfAddress || '',
      }));

      const serverStep = summary.onboardingStep ?? 1;
      if (lastSyncedStepRef.current === null) {
        setActiveStep(initialStep || serverStep);
        lastSyncedStepRef.current = serverStep;
      } else if (serverStep !== lastSyncedStepRef.current) {
        setActiveStep(serverStep);
        lastSyncedStepRef.current = serverStep;
      }
    }
  }, [summary]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'stateOfOrigin') {
        updated.lga = ''; // Reset LGA when state of origin changes
      }
      return updated;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'idDocument' | 'selfie' | 'proofOfAddress') => {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !validExtensions.includes(extension)) {
      alert('Invalid file type. Only PDF, JPG, and PNG are allowed.');
      e.target.value = '';
      return;
    }

    // Validate size (5MB based on UI)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds the 5MB limit.');
      e.target.value = '';
      return;
    }

    setSelectedFiles((prev) => ({ ...prev, [field]: file }));
    e.target.value = ''; // Reset input to allow re-selecting the same file if needed
  };

  const handleSaveProfile = async () => {
    // Saves Steps 1, 2, 3
    setLoading(true);
    setError(null);
    try {
      const res = await api('/api/user/onboarding/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender: formData.gender,
          dob: formData.dob,
          country: formData.country,
          state: formData.state,
          stateOfOrigin: formData.stateOfOrigin,
          lga: formData.lga,
          city: formData.city,
          address: formData.address,
          nextOfKinName: formData.nextOfKinName,
          nextOfKinPhone: formData.nextOfKinPhone,
          relationship: formData.relationship,
          nextOfKinAddress: formData.nextOfKinAddress,
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          accountName: formData.accountName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save profile information');
      }

      setActiveStep(4); // Advance to Step 4 (KYC)
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving profile info.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitKYC = async () => {
    setLoading(true);
    setError(null);
    try {
      let idDocumentUrl = formData.idDocument;
      let selfieUrl = formData.selfie;
      let proofOfAddressUrl = formData.proofOfAddress;

      const uploadFile = async (file: File) => {
        const uploadData = new FormData();
        uploadData.append('file', file);
        const res = await api('/api/user/kyc/upload', {
          method: 'POST',
          body: uploadData,
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'Upload failed');
        }
        const data = await res.json();
        return data.secure_url;
      };

      if (selectedFiles.idDocument) {
        idDocumentUrl = await uploadFile(selectedFiles.idDocument);
        setFormData((prev) => ({ ...prev, idDocument: idDocumentUrl }));
      }
      if (selectedFiles.selfie) {
        selfieUrl = await uploadFile(selectedFiles.selfie);
        setFormData((prev) => ({ ...prev, selfie: selfieUrl }));
      }
      if (selectedFiles.proofOfAddress) {
        proofOfAddressUrl = await uploadFile(selectedFiles.proofOfAddress);
        setFormData((prev) => ({ ...prev, proofOfAddress: proofOfAddressUrl }));
      }

      const res = await api('/api/user/kyc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idType: formData.idType,
          idNumber: formData.idNumber || 'NOT_PROVIDED',
          idDocument: idDocumentUrl,
          selfie: selfieUrl,
          proofOfAddress: proofOfAddressUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit KYC files');
      }

      setSuccess('KYC documents submitted successfully for compliance review.');
      setSelectedFiles({ idDocument: null, selfie: null, proofOfAddress: null });
      setTimeout(() => {
        setSuccess(null);
        setActiveStep(5); // Advance to Step 5 (Activation)
        onRefresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting identity files.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitActivation = async () => {
    if (!formData.code.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api('/api/user/activation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: formData.code.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit activation code');
      }

      setSuccess(data.message || 'Account successfully activated!');
      onRefresh();
      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during account activation.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSkipActivation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api('/api/user/onboarding/skip-activation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to skip activation');
      }

      setSuccess('Onboarding completed. Activation skipped.');
      onRefresh();
      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while skipping activation.');
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (stepNumber: number): boolean => {
    if (stepNumber === 1) {
      return !!(
        formData.gender &&
        formData.dob &&
        formData.state &&
        formData.stateOfOrigin &&
        formData.lga &&
        formData.city &&
        formData.address
      );
    }
    if (stepNumber === 2) {
      return !!(
        formData.nextOfKinName &&
        formData.nextOfKinPhone &&
        formData.relationship &&
        formData.nextOfKinAddress
      );
    }
    if (stepNumber === 3) {
      return !!(formData.bankName && formData.accountNumber && formData.accountName);
    }
    if (stepNumber === 4) {
      return !!((formData.idDocument || selectedFiles.idDocument) && 
                (formData.selfie || selectedFiles.selfie) && 
                (formData.proofOfAddress || selectedFiles.proofOfAddress));
    }
    return true;
  };

  const stepsList = [
    { id: 1, label: 'Personal Information', icon: User },
    { id: 2, label: 'Next Of Kin', icon: Users },
    { id: 3, label: 'Banking Information', icon: CreditCard },
    { id: 4, label: 'Identity Verification', icon: ShieldCheck },
    { id: 5, label: 'Activation', icon: KeyRound },
  ];

  return (
    <div className="bg-white rounded-3xl border border-indigo-150 shadow-md shadow-indigo-600/5 overflow-hidden animate-fade-in space-y-6">
      {/* Banner / Header */}
      <div className="bg-gradient-to-r from-indigo-50/50 via-blue-50/20 to-white p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-50 rounded-full p-1.5 shadow-sm border border-gray-200 transition-colors z-10"
          >
            <X size={18} />
          </button>
        )}
        <div className="space-y-1.5 mt-2 md:mt-0">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="text-lg font-bold text-gray-900">Complete Onboarding</h2>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed max-w-xl">
            Please complete the guided profile setup, submit KYC documents, and enter your Activation Code to unlock withdrawals and full GMA platform access.
          </p>
        </div>
        <div className="flex-shrink-0 bg-indigo-50/30 border border-indigo-100 px-4 py-2.5 rounded-2xl flex items-center gap-3">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">onboarding status</span>
            <span className="text-xs font-extrabold text-indigo-700 uppercase font-mono tracking-wider">
              {summary.status?.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Steps Nav Row */}
      <div className="px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
          {stepsList.map((step) => {
            const StepIcon = step.icon;
            const isCompleted = (summary.onboardingStep ?? 1) > step.id;
            const isActive = activeStep === step.id;

            return (
              <button
                key={`step-btn-${step.id}`}
                disabled={step.id > (summary.onboardingStep ?? 1)}
                onClick={() => {
                  setError(null);
                  setActiveStep(step.id);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10'
                    : isCompleted
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <StepIcon size={14} />
                <span>{step.label}</span>
                {isCompleted && <span className="ml-1 text-[10px] text-emerald-600">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notifications */}
      <div className="px-6">
        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-2xl flex items-start gap-3 text-xs font-semibold">
            <AlertTriangle className="text-rose-600 mt-0.5 flex-shrink-0" size={16} />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-2xl flex items-start gap-3 text-xs font-semibold">
            <CheckCircle2 className="text-emerald-600 mt-0.5 flex-shrink-0" size={16} />
            <div className="flex-1">{success}</div>
          </div>
        )}
      </div>

      {/* Step Panels */}
      <div className="px-6 pb-6">
        {/* Step 1: Personal Info */}
        {activeStep === 1 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Step 1 — Personal Information</h3>
            
            {/* Prefilled info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  disabled
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-100 rounded-xl bg-gray-50 text-gray-500 font-semibold cursor-not-allowed"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  disabled
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-100 rounded-xl bg-gray-50 text-gray-500 font-semibold cursor-not-allowed"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Email Address</label>
                <input
                  type="text"
                  value={formData.email}
                  disabled
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-100 rounded-xl bg-gray-50 text-gray-500 font-semibold cursor-not-allowed"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  disabled
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-100 rounded-xl bg-gray-50 text-gray-500 font-semibold cursor-not-allowed"
                />
              </div>
            </div>

            {/* Editable Profile Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  disabled
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-100 rounded-xl bg-gray-50 text-gray-500 font-semibold cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">State of Residence</label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                >
                  <option value="">Select State</option>
                  {statesList.map((st) => (
                    <option key={`state-opt-${st}`} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">State of Origin</label>
                <select
                  name="stateOfOrigin"
                  value={formData.stateOfOrigin}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                >
                  <option value="">Select State of Origin</option>
                  {statesList.map((st) => (
                    <option key={`origin-opt-${st}`} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Local Government Area (LGA)</label>
                <select
                  name="lga"
                  value={formData.lga}
                  onChange={handleInputChange}
                  disabled={!formData.stateOfOrigin}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900 disabled:opacity-50"
                >
                  <option value="">{formData.stateOfOrigin ? 'Select LGA' : 'Select a state of origin first'}</option>
                  {statesOfOriginLgas.map((lg) => (
                    <option key={`lga-opt-${lg}`} value={lg}>{lg}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">City</label>
                <input
                  type="text"
                  name="city"
                  placeholder="Enter city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Residential Address</label>
                <input
                  type="text"
                  name="address"
                  placeholder="Enter street address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="button"
                disabled={!validateStep(1)}
                onClick={() => setActiveStep(2)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-xl transition-all text-xs disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                Next Step <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Next of Kin */}
        {activeStep === 2 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Step 2 — Next Of Kin</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Next Of Kin Name</label>
                <input
                  type="text"
                  name="nextOfKinName"
                  placeholder="Full name of next of kin"
                  value={formData.nextOfKinName}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Next Of Kin Phone Number</label>
                <input
                  type="tel"
                  name="nextOfKinPhone"
                  placeholder="e.g. +234..."
                  value={formData.nextOfKinPhone}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Relationship</label>
                <input
                  type="text"
                  name="relationship"
                  placeholder="e.g. Spouse, Brother, Sister"
                  value={formData.relationship}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Next Of Kin Address</label>
                <input
                  type="text"
                  name="nextOfKinAddress"
                  placeholder="Next of kin home address"
                  value={formData.nextOfKinAddress}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-5 rounded-xl transition-all text-xs"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!validateStep(2)}
                onClick={() => setActiveStep(3)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-xl transition-all text-xs disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                Next Step <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Banking Info */}
        {activeStep === 3 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Step 3 — Banking Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Bank Name</label>
                <select
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900 bg-white"
                >
                  <option value="" disabled>Select a bank</option>
                  {[
                    "Access Bank", "Citibank Nigeria", "Ecobank Nigeria", "FCMB (First City Monument Bank)",
                    "Fidelity Bank", "First Bank of Nigeria", "Globus Bank", "Guaranty Trust Bank (GTCO)",
                    "Keystone Bank", "Nova Commercial Bank", "Optimus Bank", "Parallex Bank", "Polaris Bank",
                    "PremiumTrust Bank", "Providus Bank", "Stanbic IBTC Bank", "Standard Chartered Bank Nigeria",
                    "Sterling Bank", "Titan Trust Bank", "Union Bank of Nigeria", "United Bank for Africa (UBA)",
                    "Unity Bank", "Wema Bank", "Zenith Bank", "Kuda Bank", "Moniepoint Microfinance Bank",
                    "OPay", "PalmPay", "Dot Microfinance Bank", "VFD Microfinance Bank"
                  ].map(bank => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Account Number</label>
                <input
                  type="text"
                  name="accountNumber"
                  placeholder="10 digit account number"
                  maxLength={10}
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900 font-mono"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Account Name</label>
                <input
                  type="text"
                  name="accountName"
                  placeholder="Official name on bank account"
                  value={formData.accountName}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-5 rounded-xl transition-all text-xs"
              >
                Back
              </button>
              <button
                type="button"
                disabled={loading || !validateStep(3)}
                onClick={handleSaveProfile}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-xl transition-all text-xs disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {loading && <Loader2 className="animate-spin" size={14} />}
                Save and Continue <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Identity Verification */}
        {activeStep === 4 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Step 4 — Identity Verification</h3>
            
            <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800 font-semibold leading-relaxed">
              <AlertTriangle className="text-amber-600 mt-0.5 flex-shrink-0" size={16} />
              <p>Upload clear digital photos or scans of your document. Supported formats: JPG, PNG. Max file size: 5MB per upload.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Government ID Type</label>
                <select
                  name="idType"
                  value={formData.idType}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                >
                  <option value="NIN">National ID Card (NIN)</option>
                  <option value="BVN">Bank Verification Number (BVN)</option>
                  <option value="PASSPORT">International Passport</option>
                  <option value="DRIVERS_LICENSE">Driver's License</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Government ID Number</label>
                <input
                  type="text"
                  name="idNumber"
                  placeholder="ID Card Number"
                  value={formData.idNumber}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900 font-mono"
                />
              </div>
            </div>

            {/* Document Uploader Row */}
            <div className="space-y-4">
              {/* ID Document */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700">1. Government Issued ID Scan (Front)</label>
                <label className={`flex flex-col items-center justify-center border-2 border-dashed p-6 rounded-2xl cursor-pointer hover:bg-gray-50/50 transition-all ${
                  (formData.idDocument || selectedFiles.idDocument) ? 'border-emerald-200 bg-emerald-50/10' : 'border-gray-200'
                }`}>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(e) => handleFileChange(e, 'idDocument')} />
                  {(formData.idDocument || selectedFiles.idDocument) ? (
                    <div className="text-center space-y-1">
                      <CheckCircle2 className="text-emerald-500 mx-auto" size={24} />
                      <span className="text-xs text-emerald-700 font-bold block">ID Document Attached {selectedFiles.idDocument && `(${selectedFiles.idDocument.name})`}</span>
                    </div>
                  ) : (
                    <div className="text-center space-y-2 text-gray-400">
                      <Upload className="mx-auto" size={24} />
                      <span className="text-xs font-semibold block">Click to select file</span>
                    </div>
                  )}
                </label>
              </div>

              {/* Selfie */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700">2. Selfie Photo holding ID</label>
                <label className={`flex flex-col items-center justify-center border-2 border-dashed p-6 rounded-2xl cursor-pointer hover:bg-gray-50/50 transition-all ${
                  (formData.selfie || selectedFiles.selfie) ? 'border-emerald-200 bg-emerald-50/10' : 'border-gray-200'
                }`}>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(e) => handleFileChange(e, 'selfie')} />
                  {(formData.selfie || selectedFiles.selfie) ? (
                    <div className="text-center space-y-1">
                      <CheckCircle2 className="text-emerald-500 mx-auto" size={24} />
                      <span className="text-xs text-emerald-700 font-bold block">Selfie Attached {selectedFiles.selfie && `(${selectedFiles.selfie.name})`}</span>
                    </div>
                  ) : (
                    <div className="text-center space-y-2 text-gray-400">
                      <Upload className="mx-auto" size={24} />
                      <span className="text-xs font-semibold block">Click to select selfie</span>
                    </div>
                  )}
                </label>
              </div>

              {/* Proof of Address */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700">3. Proof of Address Document (Last 3 months utility bill / statement)</label>
                <label className={`flex flex-col items-center justify-center border-2 border-dashed p-6 rounded-2xl cursor-pointer hover:bg-gray-50/50 transition-all ${
                  (formData.proofOfAddress || selectedFiles.proofOfAddress) ? 'border-emerald-200 bg-emerald-50/10' : 'border-gray-200'
                }`}>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(e) => handleFileChange(e, 'proofOfAddress')} />
                  {(formData.proofOfAddress || selectedFiles.proofOfAddress) ? (
                    <div className="text-center space-y-1">
                      <CheckCircle2 className="text-emerald-500 mx-auto" size={24} />
                      <span className="text-xs text-emerald-700 font-bold block">Proof of Address Attached {selectedFiles.proofOfAddress && `(${selectedFiles.proofOfAddress.name})`}</span>
                    </div>
                  ) : (
                    <div className="text-center space-y-2 text-gray-400">
                      <Upload className="mx-auto" size={24} />
                      <span className="text-xs font-semibold block">Click to select document</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-5 rounded-xl transition-all text-xs"
              >
                Back
              </button>
              <button
                type="button"
                disabled={loading || !validateStep(4)}
                onClick={handleSubmitKYC}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-xl transition-all text-xs disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {loading && <Loader2 className="animate-spin" size={14} />}
                Submit KYC <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Activation Code */}
        {activeStep === 5 && (
          <div className="space-y-5 animate-fade-in">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Step 5 — Activation</h3>

            <div className="p-4 bg-indigo-50/30 border border-indigo-100 rounded-2xl flex items-start gap-2.5 text-xs text-indigo-900 font-semibold leading-relaxed">
              <KeyRound className="text-indigo-600 mt-0.5 flex-shrink-0" size={16} />
              <div>
                <p className="font-bold">Provide Activation Pin</p>
                <p className="text-gray-500 mt-1">Please enter the security activation code issued to you by the admin desk to complete registration and unlock full membership features.</p>
              </div>
            </div>

            {/* KYC Submission Alert if pending */}
            {summary.kycStatus === 'SUBMITTED' && (
              <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-center gap-2.5 text-xs text-amber-800 font-semibold">
                <Loader2 className="animate-spin text-amber-600 flex-shrink-0" size={16} />
                <span>KYC submission is under compliance review. Full account will unlock once approved.</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Activation Code</label>
                <input
                  type="text"
                  name="code"
                  placeholder="GMA-ACTXXXXXXXX"
                  value={formData.code}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900 font-mono uppercase tracking-wider"
                />
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveStep(4)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-5 rounded-xl transition-all text-xs"
                >
                  Back
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleSkipActivation}
                    className="text-gray-500 hover:text-gray-700 font-semibold py-2 px-4 rounded-xl transition-all text-xs border border-gray-200 hover:bg-gray-50"
                  >
                    Skip for now
                  </button>
                  <button
                    type="button"
                    disabled={loading || !formData.code.trim()}
                    onClick={handleSubmitActivation}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-xl transition-all text-xs disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {loading && <Loader2 className="animate-spin" size={14} />}
                    Redeem and Activate
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
