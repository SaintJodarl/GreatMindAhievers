'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface RegistrationNewFormProps {
  sponsorCode: string;
}

const STATES = [
  'Lagos',
  'Abuja',
  'Kano',
  'Rivers',
  'Oyo',
  'Enugu',
  'Edo',
  'Delta',
  'Anambra',
  'Ogun',
  'Kaduna',
  'Cross River',
  'Abia',
  'Akwa Ibom',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Ebonyi',
  'Ekiti',
  'Gombe',
  'Imo',
  'Jigawa',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Nasarawa',
  'Niger',
  'Ondo',
  'Osun',
  'Plateau',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
  'Other',
];

export default function RegistrationNewForm({ sponsorCode }: RegistrationNewFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    state: 'Lagos',
    preferredPosition: 'LEFT',
    registrationCode: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = 'Full Name is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email address';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    }
    if (!formData.registrationCode.trim()) {
      errors.registrationCode = 'Registration Activation Code is required';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          state: formData.state,
          preferredPosition: formData.preferredPosition,
          registrationCode: formData.registrationCode,
          sponsorCode: sponsorCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to register new member.');
      }

      setSuccess('New member registered successfully! They have been placed in the binary tree.');
      // Clear form
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        state: 'Lagos',
        preferredPosition: 'LEFT',
        registrationCode: '',
      });
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-150">
        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
          <UserPlus size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">New Registration Form</h2>
          <p className="text-sm text-gray-500">Provide details for the new network member.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl mb-6 bg-red-50 border border-red-200 text-red-700">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold">Registration Failed:</span> {error}
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 p-4 rounded-xl mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700">
          <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold">Success:</span> {success}
            <div className="mt-2">
              <button
                type="button"
                onClick={() => router.push('/user-dashboard/registration/history')}
                className="text-xs font-semibold underline text-emerald-800 hover:text-emerald-900"
              >
                View in Registration History
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. John Doe"
              className={`w-full bg-gray-50 border rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                validationErrors.name
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-gray-200 focus:border-indigo-500'
              }`}
            />
            {validationErrors.name && (
              <p className="text-xs text-red-500 mt-1">{validationErrors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. email@example.com"
              className={`w-full bg-gray-50 border rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                validationErrors.email
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-gray-200 focus:border-indigo-500'
              }`}
            />
            {validationErrors.email && (
              <p className="text-xs text-red-500 mt-1">{validationErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Password (min. 8 chars)
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className={`w-full bg-gray-50 border rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                validationErrors.password
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-gray-200 focus:border-indigo-500'
              }`}
            />
            {validationErrors.password && (
              <p className="text-xs text-red-500 mt-1">{validationErrors.password}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. +2348012345678"
              className={`w-full bg-gray-50 border rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                validationErrors.phone
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-gray-200 focus:border-indigo-500'
              }`}
            />
            {validationErrors.phone && (
              <p className="text-xs text-red-500 mt-1">{validationErrors.phone}</p>
            )}
          </div>

          {/* State */}
          <div>
            <label htmlFor="state" className="block text-sm font-semibold text-gray-700 mb-1.5">
              State
            </label>
            <select
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              {STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Preferred Position */}
          <div>
            <label
              htmlFor="preferredPosition"
              className="block text-sm font-semibold text-gray-700 mb-1.5"
            >
              Placement Position
            </label>
            <select
              id="preferredPosition"
              name="preferredPosition"
              value={formData.preferredPosition}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              <option value="LEFT">Left Leg</option>
              <option value="RIGHT">Right Leg</option>
            </select>
          </div>

          {/* Sponsor Code (Read Only) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sponsor Code</label>
            <input
              type="text"
              value={sponsorCode}
              readOnly
              disabled
              className="w-full bg-gray-100 border border-gray-200 rounded-xl p-3 text-sm text-gray-500 cursor-not-allowed font-mono font-bold"
            />
            <p className="text-xs text-gray-400 mt-1">Pre-filled with your referral code.</p>
          </div>

          {/* Registration Code */}
          <div>
            <label
              htmlFor="registrationCode"
              className="block text-sm font-semibold text-gray-700 mb-1.5"
            >
              Registration Activation Code
            </label>
            <input
              type="text"
              id="registrationCode"
              name="registrationCode"
              value={formData.registrationCode}
              onChange={handleChange}
              placeholder="e.g. REG-XXXX-XXXX"
              className={`w-full bg-gray-50 border rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono uppercase ${
                validationErrors.registrationCode
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-gray-200 focus:border-indigo-500'
              }`}
            />
            {validationErrors.registrationCode && (
              <p className="text-xs text-red-500 mt-1">{validationErrors.registrationCode}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">Provide a valid, unused registration code.</p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-150">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center justify-center gap-2 w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3.5 rounded-xl disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors shadow-md shadow-indigo-600/10"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Registering Member...
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Register Member
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
