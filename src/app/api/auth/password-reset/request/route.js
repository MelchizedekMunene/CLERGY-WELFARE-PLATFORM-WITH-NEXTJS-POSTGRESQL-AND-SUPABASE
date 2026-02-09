// POST /api/auth/password-reset/request
// Request OTP for password reset
import { prisma } from '@/lib/prisma';
import { generateOTP, hashOTP, getOTPExpiration } from '@/lib/otp';
import { sendOTPEmail } from '@/lib/email';

export async function POST(request) {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email || !email.includes('@')) {
      return Response.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, full_name: true, email: true },
    });

    if (!user) {
      // For security, don't reveal if email exists
      return Response.json(
        { message: 'If an account exists with this email, an OTP will be sent' },
        { status: 200 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);
    const expiresAt = getOTPExpiration();

    // Save OTP to database
    await prisma.passwordReset.create({
      data: {
        email: user.email,
        otp_token: hashedOTP,
        expires_at: expiresAt,
        is_used: false,
      },
    });

    // Send OTP email
    await sendOTPEmail(user.email, otp, user.full_name);

    return Response.json(
      {
        message: 'OTP sent successfully',
        email: user.email,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error requesting OTP:', error);
    return Response.json(
      { error: error.message || 'Failed to request OTP' },
      { status: 500 }
    );
  }
}
