// POST /api/auth/password-reset/verify
// Verify OTP code
import { prisma } from '@/lib/prisma';
import { verifyOTP, isOTPExpired } from '@/lib/otp';

export async function POST(request) {
  try {
    const { email, otp } = await request.json();

    // Validate inputs
    if (!email || !otp) {
      return Response.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Find the latest OTP for this email
    const passwordReset = await prisma.passwordReset.findFirst({
      where: {
        email: email.toLowerCase(),
        is_used: false,
      },
      orderBy: { created_at: 'desc' },
    });

    if (!passwordReset) {
      return Response.json(
        { error: 'No OTP request found. Please request a new OTP.' },
        { status: 404 }
      );
    }

    // Check if OTP has expired
    if (isOTPExpired(passwordReset.expires_at)) {
      return Response.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify OTP
    if (!verifyOTP(otp, passwordReset.otp_token)) {
      return Response.json(
        { error: 'Invalid OTP. Please try again.' },
        { status: 401 }
      );
    }

    // Mark OTP as used and verified
    await prisma.passwordReset.update({
      where: { id: passwordReset.id },
      data: {
        is_used: true,
        verified_at: new Date(),
      },
    });

    // Generate a temporary token for password reset confirmation
    // This token is used to prevent tampering
    const resetToken = Buffer.from(
      JSON.stringify({
        email: email.toLowerCase(),
        verified_at: new Date().toISOString(),
        otpId: passwordReset.id,
      })
    ).toString('base64');

    return Response.json(
      {
        message: 'OTP verified successfully',
        resetToken,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return Response.json(
      { error: error.message || 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
