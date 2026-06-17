'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, AlertCircle } from 'lucide-react';

export default function CompleteKycPage() {
  const router = useRouter();
  const [kycData, setKycData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    state: '',
    lga: '',
    idType: 'NIN',
    idNumber: '',
    idDocument: '',
    selfie: '',
  });

  const fetchKycStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/user/kyc/status');
      if (!res.ok) {
        throw new Error('Failed to fetch KYC status');
      }
      const data = await res.json();
      setKycData(data);
      // Pre-fill name and phone if available
      if (data) {
        setFormData((prev) => ({
          ...prev,
          fullName: data.fullName || '',
          phone: data.phone || '',
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

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'idDocument' | 'selfie'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds 2MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!formData.idDocument || !formData.selfie) {
      setError('Please upload both your ID Document and a Selfie.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/user/kyc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'Failed to submit KYC details');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/user-dashboard/kyc/status');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
        <p className="text-sm text-gray-500">Checking verification status...</p>
      </div>
    );
  }

  // Prevent resubmission logic
  if (kycData?.kycStatus === 'SUBMITTED') {
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

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-2xl">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID Document Image
              </label>
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 flex flex-col gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'idDocument')}
                  className="text-xs text-gray-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {formData.idDocument && (
                  <span className="text-[10px] text-green-600 font-medium">
                    ✓ Uploaded & Compressed
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selfie with ID</label>
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 flex flex-col gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'selfie')}
                  className="text-xs text-gray-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {formData.selfie && (
                  <span className="text-[10px] text-green-600 font-medium">
                    ✓ Uploaded & Compressed
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-400 mt-2">
            * Max file size: 2MB. Only image formats (PNG, JPG, JPEG) are supported.
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                Submitting...
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
