'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api-client';
import { getStates, getLgasForState } from '@/lib/nigeria-locations';
import {
  User,
  ShieldCheck,
  CreditCard,
  Upload,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, checkSession } = useAuth();
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States & LGAs datasets
  const statesList = getStates();

  // Form states mapping Profile, Bank, KYC
  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    gender: 'Male',
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

    // Step 4: Identity Verification (KYC)
    idType: 'NIN',
    idNumber: '',
    idDocument: '',
    selfie: '',
    proofOfAddress: '',
  });

  const lgas = React.useMemo(() => getLgasForState(formData.state), [formData.state]);
  const stateOfOriginLgas = React.useMemo(() => getLgasForState(formData.stateOfOrigin), [formData.stateOfOrigin]);


  useEffect(() => {
    // If user is already complete, redirect to dashboard
    if (user && user.onboardingStatus === 'COMPLETE') {
      router.push('/user-dashboard');
    }
  }, [user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'state') {
        updated.lga = ''; // Reset LGA when residential state changes
      }
      return updated;
    });
  };

  // Simulated file drop uploader handler
  const handleSimulatedUpload = (fieldName: string) => {
    setLoading(true);
    // Simulating file upload encoding to data-URL
    setTimeout(() => {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: `https://gma-network.s3.amazonaws.com/uploads/${fieldName}_${Date.now()}.png`,
      }));
      setLoading(false);
    }, 800);
  };

  const handleNextStep = () => {
    setError(null);
    // Basic step validations
    if (activeStep === 1) {
      if (!formData.dob || !formData.state || !formData.lga || !formData.city || !formData.address) {
        setError('Please fill out all personal information fields.');
        return;
      }
    }
    if (activeStep === 2) {
      if (!formData.nextOfKinName || !formData.nextOfKinPhone || !formData.relationship || !formData.nextOfKinAddress) {
        setError('Please provide all Next of Kin details.');
        return;
      }
    }
    if (activeStep === 3) {
      if (!formData.bankName || !formData.accountNumber || !formData.accountName) {
        setError('Please provide complete banking details.');
        return;
      }
    }
    setActiveStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setError(null);
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmitOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!formData.idDocument || !formData.selfie || !formData.proofOfAddress) {
      setError('Please upload all required identity documents.');
      setLoading(false);
      return;
    }

    try {
      // 1. Submit Profile details
      const profileRes = await api('/api/user/onboarding/profile', {
        method: 'POST',
        body: JSON.stringify({
          gender: formData.gender,
          dob: formData.dob,
          country: formData.country,
          state: formData.state,
          stateOfOrigin: formData.stateOfOrigin || formData.state,
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

      if (!profileRes.ok) {
        const data = await profileRes.json();
        throw new Error(data.message || 'Failed to save profile onboarding details.');
      }

      // 2. Submit KYC Documentations
      const kycRes = await api('/api/user/kyc/submit', {
        method: 'POST',
        body: JSON.stringify({
          idType: formData.idType,
          idNumber: formData.idNumber || 'NOT_PROVIDED',
          idDocument: formData.idDocument,
          selfie: formData.selfie,
          proofOfAddress: formData.proofOfAddress,
        }),
      });

      if (!kycRes.ok) {
        const data = await kycRes.json();
        throw new Error(data.message || 'Failed to submit KYC documentation.');
      }

      // 3. Mark Onboarding Status as COMPLETE
      const completeRes = await api('/api/user/onboarding/complete', {
        method: 'POST',
      });

      if (!completeRes.ok) {
        const data = await completeRes.json();
        throw new Error(data.message || 'Failed to complete onboarding session.');
      }

      // 4. Force frontend to re-validate token/cookie and fetch active profile
      await checkSession();

      // Redirect to dashboard
      router.push('/user-dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred during onboarding.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl w-full mx-auto space-y-8 bg-slate-950/40 p-8 md:p-12 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-xl animate-fade-in">
        
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <UserCheck size={32} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Complete Your Profile
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Please complete the onboarding steps below to unlock full GMA dashboard features.
          </p>
        </div>

        {/* Steps Progress Indicators */}
        <div className="flex items-center justify-between max-w-md mx-auto py-6">
          {[1, 2, 3, 4].map((step) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border transition-all duration-300 ${
                    activeStep >= step
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/35 scale-105'
                      : 'bg-slate-800/80 border-slate-700 text-slate-500'
                  }`}
                >
                  {step}
                </div>
                <span className="text-[10px] mt-1 text-slate-400 font-medium">
                  {step === 1 ? 'Personal' : step === 2 ? 'Next of Kin' : step === 3 ? 'Banking' : 'KYC Docs'}
                </span>
              </div>
              {step < 4 && (
                <div
                  className={`flex-1 h-[2px] transition-all duration-300 ${
                    activeStep > step ? 'bg-indigo-600' : 'bg-slate-800'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-400 animate-slide-up">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {/* STEP 1: Personal Details */}
          {activeStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-3">Step 1 — Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other / Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Residential State</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  >
                    <option value="">Select State</option>
                    {statesList.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">LGA (Local Govt Area)</label>
                  <select
                    name="lga"
                    value={formData.lga}
                    onChange={handleChange}
                    disabled={!formData.state}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-40 transition-all"
                  >
                    <option value="">{formData.state ? 'Select LGA' : 'Select a state first'}</option>
                    {lgas.map((lg) => (
                      <option key={lg} value={lg}>{lg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">State of Origin (Optional)</label>
                  <select
                    name="stateOfOrigin"
                    value={formData.stateOfOrigin}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  >
                    <option value="">Select Origin State</option>
                    {statesList.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Ikeja"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Residential Address</label>
                <textarea
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g. Flat 12, Allen Avenue"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Next of Kin */}
          {activeStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-3">Step 2 — Next of Kin</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Next of Kin Full Name</label>
                  <input
                    type="text"
                    name="nextOfKinName"
                    value={formData.nextOfKinName}
                    onChange={handleChange}
                    placeholder="e.g. Mary Doe"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Next of Kin Phone</label>
                  <input
                    type="tel"
                    name="nextOfKinPhone"
                    value={formData.nextOfKinPhone}
                    onChange={handleChange}
                    placeholder="e.g. +234..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Relationship</label>
                  <input
                    type="text"
                    name="relationship"
                    value={formData.relationship}
                    onChange={handleChange}
                    placeholder="e.g. Spouse, Brother, Sister"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Next of Kin Address</label>
                <textarea
                  name="nextOfKinAddress"
                  rows={2}
                  value={formData.nextOfKinAddress}
                  onChange={handleChange}
                  placeholder="Address of Next of Kin"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Banking Details */}
          {activeStep === 3 && (
            <div className="space-y-6 animate-fade-in font-sans">
              <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-3">Step 3 — Banking Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Bank Name</label>
                  <select
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  >
                    <option value="">Select Bank</option>
                    <option value="Access Bank">Access Bank</option>
                    <option value="GTBank">Guaranty Trust Bank (GTB)</option>
                    <option value="Zenith Bank">Zenith Bank</option>
                    <option value="UBA">United Bank for Africa (UBA)</option>
                    <option value="First Bank">First Bank of Nigeria</option>
                    <option value="Fidelity Bank">Fidelity Bank</option>
                    <option value="Sterling Bank">Sterling Bank</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Account Number</label>
                  <input
                    type="text"
                    name="accountNumber"
                    maxLength={10}
                    value={formData.accountNumber}
                    onChange={handleChange}
                    placeholder="10-digit NUBAN number"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Account Name</label>
                  <input
                    type="text"
                    name="accountName"
                    value={formData.accountName}
                    onChange={handleChange}
                    placeholder="Full account name (must match your registered identity)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Documents Uploads */}
          {activeStep === 4 && (
            <div className="space-y-6 animate-fade-in font-sans">
              <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-3">Step 4 — Identity Document Verification</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Identity Type</label>
                  <select
                    name="idType"
                    value={formData.idType}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  >
                    <option value="NIN">National Identification Number (NIN)</option>
                    <option value="BVN">Bank Verification Number (BVN)</option>
                    <option value="PASSPORT">International Passport</option>
                    <option value="DRIVERS_LICENSE">Driver's License</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">ID Number</label>
                  <input
                    type="text"
                    name="idNumber"
                    value={formData.idNumber}
                    onChange={handleChange}
                    placeholder="Enter ID Number"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Upload boxes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                {/* ID Doc */}
                <div className="space-y-2">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Government ID Document</span>
                  {formData.idDocument ? (
                    <div className="flex flex-col items-center justify-center border border-emerald-500/25 bg-emerald-500/5 rounded-2xl p-4 text-emerald-400">
                      <CheckCircle2 size={32} className="mb-2" />
                      <span className="text-[11px] font-medium text-center">ID Document Uploaded</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSimulatedUpload('idDocument')}
                      disabled={loading}
                      className="w-full flex flex-col items-center justify-center border border-dashed border-slate-700 bg-slate-900 hover:bg-slate-800/80 rounded-2xl p-6 transition-all text-slate-400 disabled:opacity-50"
                    >
                      <Upload size={24} className="mb-2 text-indigo-400" />
                      <span className="text-xs font-semibold text-white">Click to Upload ID</span>
                      <span className="text-[10px] text-slate-500 mt-1">PNG, JPG or PDF</span>
                    </button>
                  )}
                </div>

                {/* Selfie */}
                <div className="space-y-2">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Selfie Verification</span>
                  {formData.selfie ? (
                    <div className="flex flex-col items-center justify-center border border-emerald-500/25 bg-emerald-500/5 rounded-2xl p-4 text-emerald-400">
                      <CheckCircle2 size={32} className="mb-2" />
                      <span className="text-[11px] font-medium text-center">Selfie Uploaded</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSimulatedUpload('selfie')}
                      disabled={loading}
                      className="w-full flex flex-col items-center justify-center border border-dashed border-slate-700 bg-slate-900 hover:bg-slate-800/80 rounded-2xl p-6 transition-all text-slate-400 disabled:opacity-50"
                    >
                      <Upload size={24} className="mb-2 text-indigo-400" />
                      <span className="text-xs font-semibold text-white">Upload Face Selfie</span>
                      <span className="text-[10px] text-slate-500 mt-1">Live camera snapshot</span>
                    </button>
                  )}
                </div>

                {/* Proof of Address */}
                <div className="space-y-2">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Proof of Address</span>
                  {formData.proofOfAddress ? (
                    <div className="flex flex-col items-center justify-center border border-emerald-500/25 bg-emerald-500/5 rounded-2xl p-4 text-emerald-400">
                      <CheckCircle2 size={32} className="mb-2" />
                      <span className="text-[11px] font-medium text-center">Proof Uploaded</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSimulatedUpload('proofOfAddress')}
                      disabled={loading}
                      className="w-full flex flex-col items-center justify-center border border-dashed border-slate-700 bg-slate-900 hover:bg-slate-800/80 rounded-2xl p-6 transition-all text-slate-400 disabled:opacity-50"
                    >
                      <Upload size={24} className="mb-2 text-indigo-400" />
                      <span className="text-xs font-semibold text-white">Proof of Address</span>
                      <span className="text-[10px] text-slate-500 mt-1">Utility bill / bank statement</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-6 border-t border-slate-850 flex items-center justify-between">
            {activeStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={loading}
                className="flex items-center gap-2 py-3 px-5 rounded-xl border border-slate-700 text-sm font-semibold hover:bg-slate-800 transition-colors text-slate-300 disabled:opacity-40"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            ) : (
              <div />
            )}

            {activeStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={loading}
                className="flex items-center gap-2 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold text-white transition-colors shadow-lg shadow-indigo-600/10"
              >
                Continue
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitOnboarding}
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full sm:w-auto py-3 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-700/60 disabled:cursor-not-allowed text-sm font-semibold text-white transition-colors shadow-lg shadow-indigo-600/15"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Submitting Onboarding...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Complete Setup
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
