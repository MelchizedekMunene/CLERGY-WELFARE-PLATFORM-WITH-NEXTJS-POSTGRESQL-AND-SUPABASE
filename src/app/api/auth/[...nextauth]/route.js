//Nextauth Handler
// NextAuth configuration with role-based authentication and database integration

import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export const authOptions = {
  // Ensure NEXTAUTH_URL is set for proper callback handling
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        role: { label: 'Role', type: 'text' },
      },
      async authorize(credentials) {
        try {
          // STEP 1: Validate credentials provided
          if (
            !credentials?.email ||
            !credentials?.password ||
            !credentials?.role
          ) {
            throw new Error('Email, password, and role are required');
          }

          // STEP 2: Find user by email in database
          let user;
          try {
            user = await prisma.user.findUnique({
              where: { email: credentials.email.toLowerCase() },
              select: {
                id: true,
                email: true,
                password: true,
                full_name: true,
                phone: true,
                church_name: true,
                role: true,
                is_active: true,
                registration_date: true,
              },
            });
          } catch (dbError) {
            console.error('Database connection error:', dbError);
            throw new Error('Database connection failed. Please try again later.');
          }

          // STEP 3: Check if user exists
          if (!user) {
            console.warn(
              `Login attempt with non-existent email: ${credentials.email}`
            );
            throw new Error('Invalid email or password');
          }

          // STEP 4: Verify user account is active
          if (!user.is_active) {
            console.warn(
              `Login attempt with inactive account: ${credentials.email}`
            );
            throw new Error(
              'Your account is inactive. Please contact the administrator.'
            );
          }

          // STEP 5: Verify password against stored hash
          let isPasswordValid = false;
          try {
            isPasswordValid = await bcrypt.compare(
              credentials.password,
              user.password
            );
          } catch (compareError) {
            console.error('Password comparison error:', compareError);
            throw new Error('Authentication failed');
          }

          if (!isPasswordValid) {
            console.warn(
              `Invalid password attempt for email: ${credentials.email}`
            );
            throw new Error('Invalid email or password');
          }

          // STEP 6: CRITICAL - Verify selected role matches user's actual role
          if (user.role !== credentials.role) {
            console.warn(
              `Role mismatch for user ${credentials.email}: expected ${user.role}, got ${credentials.role}`
            );
            throw new Error(
              `You do not have ${credentials.role} access. Your role is: ${user.role}`
            );
          }

          // STEP 7: Authentication successful - return user data (excluding password)
          console.log(
            `User authenticated successfully: ${user.email} (${user.role})`
          );
          return {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            phone: user.phone,
            church_name: user.church_name,
            role: user.role,
          };
        } catch (error) {
          console.error('Authorization error:', error.message);
          throw new Error(error.message || 'Authentication failed');
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Add user data to JWT token when user signs in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.full_name = user.full_name;
        token.phone = user.phone;
        token.church_name = user.church_name;
        token.role = user.role;
        token.iat = Math.floor(Date.now() / 1000);
      }
      return token;
    },
    async session({ session, token }) {
      // Add user data from token to session
      if (token && session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.full_name = token.full_name;
        session.user.phone = token.phone;
        session.user.church_name = token.church_name;
        session.user.role = token.role;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allow relative URLs and same origin absolute URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Redirect to home if url is from the same origin
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
    newUser: '/dashboard',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
