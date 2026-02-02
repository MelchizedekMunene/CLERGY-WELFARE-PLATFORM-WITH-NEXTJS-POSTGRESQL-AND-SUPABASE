'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';

export default function VerifyOTPForm({ email, onSuccess, onResend }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleInputChange = (index, value) => {
    // Only allow digits
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next field
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/password-reset/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify OTP');
      }

      setMessage('✓ OTP verified successfully!');
      setTimeout(() => {
        onSuccess(data.resetToken);
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to verify OTP');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendCountdown(30);
    setError('');
    setMessage('');
    await onResend();
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Enter 6-Digit OTP
          </label>
          <p className="text-sm text-gray-600 mb-4">
            Check your email at <span className="font-semibold text-gray-800">{email}</span>
          </p>

          {/* OTP Input Fields */}
          <div className="flex justify-center gap-3 mb-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={loading}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-lg border border-red-200">
            <AlertCircle size={18} className="flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Success Message */}
        {message && (
          <div className="flex items-center gap-2 bg-green-50 text-green-700 p-3 rounded-lg border border-green-200">
            <CheckCircle size={18} className="flex-shrink-0" />
            <span className="text-sm">{message}</span>
          </div>
        )}

        {/* Verify Button */}
        <button
          type="submit"
          disabled={loading || otp.some((digit) => !digit)}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader size={18} className="animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify OTP'
          )}
        </button>

        {/* Resend Button */}
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCountdown > 0 || loading}
          className="w-full flex items-center justify-center gap-2 text-purple-600 hover:text-purple-700 font-semibold py-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw size={16} />
          {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend OTP'}
        </button>
      </form>
    </div>
  );
}
