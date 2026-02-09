// Protected endpoint to fetch all members (Admin only)
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    // Validate that requester is an ADMIN
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // Fetch all members (exclude password field)
    const members = await prisma.user.findMany({
      where: {
        role: 'MEMBER',
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        church_name: true,
        role: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json(
      {
        members,
        count: members.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch members error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
