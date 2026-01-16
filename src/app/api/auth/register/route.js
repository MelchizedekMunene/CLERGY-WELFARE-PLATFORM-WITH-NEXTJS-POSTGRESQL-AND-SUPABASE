//Admin Endpoint (PROTECTED)
// Protected endpoint for admin to register members

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    // STEP 1: Validate that requester is an ADMIN
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // STEP 2: Parse request body
    const body = await request.json();
    const { full_name, email, phone, church_name, password, role } = body;

    // STEP 3: Validate required fields
    if (!full_name || !email || !phone || !church_name || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // STEP 4: Force role to MEMBER (admin cannot create other admins via this endpoint)
    const memberRole = 'MEMBER';

    // STEP 5: Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // STEP 6: Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // STEP 7: Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // STEP 8: Check if phone already exists
    const existingPhone = await prisma.user.findUnique({
      where: { phone },
    });

    if (existingPhone) {
      return NextResponse.json(
        { error: 'Phone number already exists' },
        { status: 409 }
      );
    }

    // STEP 9: Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // STEP 10: Create user in database
    const newUser = await prisma.user.create({
      data: {
        full_name,
        email,
        phone,
        church_name,
        password: hashedPassword,
        role: memberRole,
        is_active: true,
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
      },
    });

    // STEP 11: Return success response
    return NextResponse.json(
      {
        message: 'Member created successfully',
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
