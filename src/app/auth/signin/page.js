//Sign In Page
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SignInPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setError('');
  };

  const handleSubmit = async () => {
    if (!selectedRole) {
      setError('Please select your role first');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        role: selectedRole,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        // Redirect to dashboard - will check role and redirect to appropriate dashboard
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleKeyPress = (e) => {
    if (
      e.key === 'Enter' &&
      formData.email &&
      formData.password &&
      selectedRole
    ) {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Shepherds Welfare Platform
            </h1>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert className="mb-6 bg-red-50 border-red-200">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Role Selection - STEP 1 & 2 */}
          {!selectedRole ? (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  Select Your Role
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Choose your role to continue
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Admin Role Button */}
                <button
                  onClick={() => handleRoleSelect('ADMIN')}
                  className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-8 transition-all hover:border-blue-500 hover:shadow-lg"
                >
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                      <svg
                        className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-gray-900">ADMIN</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Administrative Access
                      </p>
                    </div>
                  </div>
                </button>

                {/* Member Role Button */}
                <button
                  onClick={() => handleRoleSelect('MEMBER')}
                  className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-8 transition-all hover:border-green-500 hover:shadow-lg"
                >
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-500 transition-colors">
                      <svg
                        className="w-8 h-8 text-green-600 group-hover:text-white transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-gray-900">
                        MEMBER
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Member Access
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Selected Role Badge */}
              <div className="mb-6 flex items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedRole === 'ADMIN' ? 'bg-blue-100' : 'bg-green-100'
                    }`}
                  >
                    <svg
                      className={`w-5 h-5 ${
                        selectedRole === 'ADMIN'
                          ? 'text-blue-600'
                          : 'text-green-600'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {selectedRole === 'ADMIN' ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      )}
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Signing in as</p>
                    <p className="font-semibold text-gray-900">
                      {selectedRole}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedRole(null);
                    setFormData({ email: '', password: '' });
                    setError('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  disabled={isLoading}
                >
                  Change Role
                </button>
              </div>

              {/* Login Form - STEP 3 */}
              <div className="space-y-6">
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    EMAIL ADDRESS
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="Enter your email"
                    disabled={isLoading}
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    PASSWORD
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      onKeyPress={handleKeyPress}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      placeholder="Enter your password"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => router.push('/auth/forgot-password')}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition"
                    disabled={isLoading}
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || !formData.email || !formData.password}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
