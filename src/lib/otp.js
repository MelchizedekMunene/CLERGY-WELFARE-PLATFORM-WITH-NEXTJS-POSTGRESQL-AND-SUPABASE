// OTP generation and verification utilities
import crypto from 'crypto';

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP code
 */
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash an OTP for storage in database
 * @param {string} otp - The OTP to hash
 * @returns {string} Hashed OTP
 */
export function hashOTP(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

/**
 * Verify an OTP against its hash
 * @param {string} otp - The OTP to verify
 * @param {string} hash - The stored hash
 * @returns {boolean} True if OTP matches hash
 */
export function verifyOTP(otp, hash) {
  const computed = hashOTP(otp);
  return computed === hash;
}

/**
 * Get expiration time (10 minutes from now)
 * @returns {Date} Expiration datetime
 */
export function getOTPExpiration() {
  return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
}

/**
 * Check if OTP has expired
 * @param {Date} expiresAt - Expiration time
 * @returns {boolean} True if expired
 */
export function isOTPExpired(expiresAt) {
  return new Date() > new Date(expiresAt);
}
