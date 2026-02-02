'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import RequestOTPForm from '../../components/RequestOTPForm';
import VerifyOTPForm from '../../components/VerifyOTPForm';
import ResetPasswordForm from '../../components/ResetPasswordForm';

export default function PasswordResetPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Verify OTP, 3: Reset Password
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');

  const handleRequestSuccess = (userEmail) => {
    setEmail(userEmail);
    setStep(2);
  };

  const handleVerifySuccess = (token) => {
    setResetToken(token);
    setStep(3);
  };

  const handleResetSuccess = () => {
    router.push('/auth/signin?resetSuccess=true');
  };

  const handleResendOTP = async () => {
    // This will request a new OTP
    try {
      await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch (error) {
      console.error('Failed to resend OTP:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      </div>

      <div className="relative max-w-md mx-auto">
        {/* Back Button */}
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
          >
            <ArrowLeft size={20} />
            Back
          </button>
        )}

        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          {/* Logo / Title */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full">
              <span className="text-white text-2xl font-bold">🔐</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
              Reset Password
            </h1>
            <p className="text-gray-600">Secure your account with a new password</p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
                    s <= step
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {s < step ? <CheckCircle2 size={24} /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition ${
                      s < step ? 'bg-purple-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Labels */}
          <div className="flex justify-between text-xs font-medium text-gray-600">
            <span className={step >= 1 ? 'text-purple-600 font-semibold' : ''}>Request</span>
            <span className={step >= 2 ? 'text-purple-600 font-semibold' : ''}>Verify</span>
            <span className={step >= 3 ? 'text-purple-600 font-semibold' : ''}>Reset</span>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-200"></div>

          {/* Form Content */}
          <div className="min-h-[400px]">
            {step === 1 && <RequestOTPForm onSuccess={handleRequestSuccess} email={email} />}
            {step === 2 && (
              <VerifyOTPForm email={email} onSuccess={handleVerifySuccess} onResend={handleResendOTP} />
            )}
            {step === 3 && (
              <ResetPasswordForm email={email} resetToken={resetToken} onSuccess={handleResetSuccess} />
            )}
          </div>

          {/* Footer */}
          <div className="border-t pt-6 text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <Link href="/auth/signin" className="text-purple-600 hover:text-purple-700 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Security Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 text-center">
          🛡️ Your data is encrypted and secure. We never store your password in plain text.
        </div>
      </div>
    </div>
  );
}
