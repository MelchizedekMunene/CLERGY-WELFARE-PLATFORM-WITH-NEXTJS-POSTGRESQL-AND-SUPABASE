//Form used by admins to register new members

'use client';

import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminMemberForm({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    church_name: '',
    password: '',
    role: 'MEMBER', // Default role, can't be changed to ADMIN via this form
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordGenerated, setPasswordGenerated] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Generate random secure password
  const generatePassword = () => {
    const length = 14;
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    const allChars = uppercase + lowercase + numbers + symbols;

    let password = '';
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));

    for (let i = 4; i < length; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    // Shuffle password
    password = password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');

    setFormData((prev) => ({ ...prev, password }));
    setPasswordGenerated(true);
    setCopiedPassword(false);
  };

  const copyPasswordToClipboard = () => {
    navigator.clipboard.writeText(formData.password);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (name === 'password') {
      setPasswordGenerated(false);
    }
  };

  // Validate form fields
  const validateForm = () => {
    // Check required fields
    if (
      !formData.full_name?.trim() ||
      !formData.email?.trim() ||
      !formData.phone?.trim() ||
      !formData.church_name?.trim() ||
      !formData.password?.trim()
    ) {
      setError('All fields are required');
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Phone validation - support multiple formats
    const phoneRegex =
      /^[+]?[(]?[0-9]{1,3}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      setError('Please enter a valid phone number');
      return false;
    }

    // Name length validation
    if (formData.full_name.length < 2) {
      setError('Full name must be at least 2 characters');
      return false;
    }

    // Password strength validation
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccess('');

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
          full_name: formData.full_name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          church_name: formData.church_name.trim(),
          password: formData.password,
          role: formData.role,
          is_active: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Failed to create member. Please try again.'
        );
      }

      setSuccess(
        `Member "${formData.full_name}" created successfully! User ID: ${data.user.id}`
      );

      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({
          full_name: '',
          email: '',
          phone: '',
          church_name: '',
          password: '',
          role: 'MEMBER',
        });
        setPasswordGenerated(false);
        setCopiedPassword(false);
        if (onSuccess) {
          onSuccess(data.user);
        }
      }, 2000);
    } catch (err) {
      setError(err.message || 'An error occurred while creating the member');
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Add New Member
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Register a new member to the Shepherds Welfare Platform
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
              disabled={isLoading}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Success Alert */}
          {success && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert className="mb-6 bg-red-50 border-red-200">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="md:col-span-2">
                <label
                  htmlFor="full_name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="John Doe"
                  disabled={isLoading}
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="john@example.com"
                  disabled={isLoading}
                />
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="+254 712 345 678"
                  disabled={isLoading}
                />
              </div>

              {/* Church Name */}
              <div className="md:col-span-2">
                <label
                  htmlFor="church_name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Church Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="church_name"
                  name="church_name"
                  type="text"
                  required
                  value={formData.church_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="St. Mary's Church"
                  disabled={isLoading}
                />
              </div>

              {/* Temporary Password */}
              <div className="md:col-span-2">
                <div className="flex justify-between items-center mb-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Temporary Password <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition"
                    disabled={isLoading}
                  >
                    {passwordGenerated ? '↻ Regenerate' : 'Generate'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    id="password"
                    name="password"
                    type="text"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-mono text-sm"
                    placeholder="Enter or generate password"
                    disabled={isLoading}
                  />
                  {formData.password && (
                    <button
                      type="button"
                      onClick={copyPasswordToClipboard}
                      className="px-3 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-600 text-sm font-medium"
                      disabled={isLoading}
                      title="Copy password"
                    >
                      {copiedPassword ? '✓ Copied' : 'Copy'}
                    </button>
                  )}
                </div>
                {passwordGenerated && (
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <span>✓</span> Secure password generated
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Member will use this password for their first login. Minimum 8
                  characters required. Keep this password secure.
                </p>
              </div>

              {/* Role (Display Only) */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <div className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600">
                  MEMBER (Cannot be changed via admin registration)
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The unique member ID will be
                automatically generated upon successful registration. The
                registration date will be set to the current time.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.password}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin">⌛</span>
                    Creating Member...
                  </>
                ) : (
                  'Create Member'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
