// POST /api/auth/password-reset/confirm
// Confirm password reset with new password
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { sendPasswordResetConfirmationEmail } from '@/lib/email';

export async function POST(request) {
  try {
    const { email, newPassword, confirmPassword, resetToken } = await request.json();

    // Validate inputs
    if (!email || !newPassword || !confirmPassword || !resetToken) {
      return Response.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Verify passwords match
    if (newPassword !== confirmPassword) {
      return Response.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return Response.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Verify reset token
    let tokenData;
    try {
      const decoded = Buffer.from(resetToken, 'base64').toString('utf-8');
      tokenData = JSON.parse(decoded);
    } catch (e) {
      return Response.json(
        { error: 'Invalid reset token' },
        { status: 400 }
      );
    }

    // Verify token email matches request email
    if (tokenData.email !== email.toLowerCase()) {
      return Response.json(
        { error: 'Token does not match email' },
        { status: 400 }
      );
    }

    // Verify the OTP record exists and was verified
    const passwordReset = await prisma.passwordReset.findUnique({
      where: { id: tokenData.otpId },
    });

    if (!passwordReset || !passwordReset.is_used || !passwordReset.verified_at) {
      return Response.json(
        { error: 'Invalid reset request' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, full_name: true },
    });

    if (!user) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Send confirmation email
    try {
      await sendPasswordResetConfirmationEmail(email, user.full_name);
    } catch (emailError) {
      console.warn('Warning: Could not send confirmation email:', emailError);
      // Don't fail the whole operation if email fails
    }

    // Clean up old password reset records for this email
    await prisma.passwordReset.deleteMany({
      where: {
        email: email.toLowerCase(),
        created_at: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Delete records older than 24 hours
        },
      },
    });

    return Response.json(
      {
        message: 'Password reset successfully',
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error confirming password reset:', error);
    return Response.json(
      { error: error.message || 'Failed to reset password' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
