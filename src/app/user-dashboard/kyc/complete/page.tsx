'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Loader2,
  AlertCircle,
  Upload,
  CheckCircle2,
  Lock,
} from 'lucide-react';

type DocumentField = 'idDocument' | 'selfie' | 'proofOfAddress';
type StatusField = 'govIdStatus' | 'selfieStatus' | 'addressStatus';

const DOCUMENTS: {
  field: DocumentField;
  statusField: StatusField;
  label: string;
  helper: string;
}[] = [
  {
    field: 'idDocument',
    statusField: 'govIdStatus',
    label: 'Government ID',
    helper: 'National ID, passport, driver license, or other government-issued document.',
  },
  {
    field: 'selfie',
    statusField: 'selfieStatus',
    label: 'Photograph/Selfie',
    helper: 'A clear recent photograph for identity matching.',
  },
  {
    field: 'proofOfAddress',
    statusField: 'addressStatus',
    label: 'Proof of Address',
    helper: 'Utility bill, bank statement, or official address document.',
  },
];

export default function CompleteKycPage() {
  const router = useRouter();
  const [kycData, setKycData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const [documentStatuses, setDocumentStatuses] = useState<Record<StatusField, string>>({
    govIdStatus: 'MISSING',
    selfieStatus: 'MISSING',
    addressStatus: 'MISSING',
  });
  const [selectedFiles, setSelectedFiles] = useState<Record<DocumentField, File | null>>({
    idDocument: null,
    selfie: null,
    proofOfAddress: null,
  });

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    state: '',
    lga: '',
    idType: 'NIN',
    idNumber: '',
  });

  const fetchKycStatus = async () => {
    try {
      setLoading(true);
      const [statusRes, documentsRes] = await Promise.all([
        fetch('/api/user/kyc/status'),
        fetch('/api/user/kyc/documents'),
      ]);

      if (!statusRes.ok) {
        throw new Error('Failed to fetch KYC status');
      }
      if (!documentsRes.ok) {
        throw new Error('Failed to fetch KYC documents');
      }

      const statusData = await statusRes.json();
      const documentsData = await documentsRes.json();
      const submission = documentsData.submission || null;

      setKycData({ ...statusData, submission });
      setDocumentStatuses({
        govIdStatus: submission?.govIdStatus || 'MISSING',
        selfieStatus: submission?.selfieStatus || 'MISSING',
        addressStatus: submission?.addressStatus || 'MISSING',
      });

      if (submission) {
        setFormData((prev) => ({
          ...prev,
          fullName: submission.fullName || prev.fullName,
          phone: submission.phone || prev.phone,
          address: submission.address || prev.address,
          state: submission.state || prev.state,
          lga: submission.lga || prev.lga,
          idType: submission.idType || prev.idType,
          idNumber:
            submission.idNumber && submission.idNumber !== 'NOT_PROVIDED'
              ? submission.idNumber
              : prev.idNumber,
        }));
      }
    } catch (err: any) {
      setError(err.message || 'Error loading KYC status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycStatus();
  }, []);

  const isDocumentApproved = (document: (typeof DOCUMENTS)[number]) =>
    documentStatuses[document.statusField] === 'APPROVED';

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: DocumentField
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'heic', 'webp'];
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension || !validExtensions.includes(extension)) {
      setError('Invalid file type. Only PDF, JPG, PNG, HEIC, and WEBP are allowed.');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds the 5MB limit.');
      e.target.value = '';
      return;
    }

    setError(null);
    setSelectedFiles((prev) => ({ ...prev, [field]: file }));
    e.target.value = '';
  };

  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const uploadFile = async (file: File) => {
    const uploadData = new FormData();
    uploadData.append('file', file);

    const res = await fetch('/api/user/kyc/upload', {
      method: 'POST',
      body: uploadData,
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'File upload failed');
    }
    if (typeof data.secure_url !== 'string' || !data.secure_url) {
      throw new Error('Upload succeeded but no secure URL was returned');
    }

    return data.secure_url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const missingDocuments = DOCUMENTS.filter(
      (document) => !isDocumentApproved(document) && !selectedFiles[document.field]
    );

    if (missingDocuments.length > 0) {
      setError(
        `Please select: ${missingDocuments.map((document) => document.label).join(', ')}.`
      );
      return;
    }

    setSubmitting(true);

    try {
      const payload: Record<string, string> = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        state: formData.state.trim(),
        lga: formData.lga.trim(),
        idType: formData.idType,
        idNumber: formData.idNumber.trim() || 'NOT_PROVIDED',
      };

      for (const document of DOCUMENTS) {
        if (isDocumentApproved(document)) {
          continue;
        }

        const file = selectedFiles[document.field];
        if (file) {
          payload[document.field] = await uploadFile(file);
        }
      }

      const res = await fetch('/api/user/kyc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'Failed to submit KYC details');
      }

      setSuccess(true);
      setSelectedFiles({ idDocument: null, selfie: null, proofOfAddress: null });
      setTimeout(() => {
        router.push('/user-dashboard/kyc/status');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderDocumentInput = (document: (typeof DOCUMENTS)[number], index: number) => {
    const approved = isDocumentApproved(document);
    const selectedFile = selectedFiles[document.field];
    const status = documentStatuses[document.statusField] || 'MISSING';

    return (
      <div key={document.field} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {index + 1}. {document.label}
        </label>
        <label
          className={`border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col items-center justify-center min-h-[136px] text-center transition ${
            approved ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100'
          }`}
        >
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.heic,.webp"
            disabled={approved || submitting}
            onChange={(e) => handleFileChange(e, document.field)}
            className="sr-only"
          />
          {approved ? (
            <>
              <Lock className="h-7 w-7 text-green-600 mb-2" />
              <span className="text-xs font-bold text-green-700">Approved and locked</span>
            </>
          ) : selectedFile ? (
            <>
              <CheckCircle2 className="h-7 w-7 text-green-600 mb-2" />
              <span className="text-xs font-bold text-green-700">{selectedFile.name}</span>
            </>
          ) : (
            <>
              <Upload className="h-7 w-7 text-indigo-500 mb-2" />
              <span className="text-xs font-semibold text-gray-700">Click to select file</span>
            </>
          )}
          <span className="text-[11px] text-gray-400 mt-2">{document.helper}</span>
        </label>
        <p className="text-[11px] font-semibold text-gray-400 uppercase">Status: {status}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
        <p className="text-sm text-gray-500">Checking verification status...</p>
      </div>
    );
  }

  if (kycData?.kycStatus === 'SUBMITTED' || kycData?.kycStatus === 'COMPLETE') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Complete KYC</h1>
          <p className="text-gray-500 mt-1">Submit your identity documents for verification.</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-yellow-100 p-8 max-w-2xl text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">KYC Under Review</h2>
          <p className="text-gray-500 mb-6">
            Your verification documents have already been submitted and are pending review by our
            compliance team. You cannot resubmit at this time.
          </p>
          <button
            onClick={() => router.push('/user-dashboard/kyc/status')}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition duration-150"
          >
            Check Status Details
          </button>
        </div>
      </div>
    );
  }

  if (kycData?.kycStatus === 'APPROVED') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Complete KYC</h1>
          <p className="text-gray-500 mt-1">Submit your identity documents for verification.</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-8 max-w-2xl text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">KYC Verified</h2>
          <p className="text-gray-500 mb-6">
            Congratulations! Your account KYC status is verified. All platform features, including
            withdrawals and commissions, are fully unlocked.
          </p>
          <button
            onClick={() => router.push('/user-dashboard')}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition duration-150"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Complete KYC</h1>
        <p className="text-gray-500 mt-1">Submit your identity documents for verification.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-4xl">
        <h2 className="text-xl font-bold text-gray-900 mb-6">KYC Submission Form</h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm rounded flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 flex-shrink-0" />
            <span>Documents submitted successfully! Redirecting...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Legal Name</label>
            <input
              type="text"
              name="fullName"
              required
              value={formData.fullName}
              onChange={handleTextChange}
              className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="As it appears on your ID"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="text"
                name="phone"
                required
                value={formData.phone}
                onChange={handleTextChange}
                className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                name="address"
                required
                value={formData.address}
                onChange={handleTextChange}
                className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Street address"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                name="state"
                required
                value={formData.state}
                onChange={handleTextChange}
                className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="State of residence"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LGA</label>
              <input
                type="text"
                name="lga"
                required
                value={formData.lga}
                onChange={handleTextChange}
                className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Local Government Area"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Type</label>
              <select
                name="idType"
                required
                value={formData.idType}
                onChange={handleTextChange}
                className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="NIN">National Identification Number (NIN)</option>
                <option value="BVN">Bank Verification Number (BVN)</option>
                <option value="PASSPORT">International Passport</option>
                <option value="DRIVERS_LICENSE">Driver's License</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
              <input
                type="text"
                name="idNumber"
                required
                value={formData.idNumber}
                onChange={handleTextChange}
                className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter document number"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {DOCUMENTS.map(renderDocumentInput)}
          </div>

          <div className="text-xs text-gray-400 mt-2">
            Max file size: 5MB. Supported formats: PDF, JPG, PNG, HEIC, and WEBP.
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                Uploading and submitting...
              </>
            ) : (
              'Submit Documents'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
