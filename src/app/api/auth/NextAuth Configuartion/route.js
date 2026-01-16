//Nextauth Handler
// NextAuth configuration with role-based authentication

import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const authOptions = {
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
          // STEP 1: Validate credentials
          if (
            !credentials?.email ||
            !credentials?.password ||
            !credentials?.role
          ) {
            throw new Error('Missing credentials');
          }

          // STEP 2: Find user by email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            throw new Error('Invalid email or password');
          }

          // STEP 3: Verify user is active
          if (!user.is_active) {
            throw new Error('Account is inactive. Please contact support.');
          }

          // STEP 4: Verify password
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            throw new Error('Invalid email or password');
          }

          // STEP 5: CRITICAL - Verify selected role matches user's actual role
          if (user.role !== credentials.role) {
            throw new Error(
              `Invalid role. You do not have ${credentials.role} access.`
            );
          }

          // STEP 6: Return user data (excluding password)
          return {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            phone: user.phone,
            church_name: user.church_name,
            role: user.role,
          };
        } catch (error) {
          console.error('Auth error:', error);
          throw new Error(error.message || 'Authentication failed');
        } finally {
          await prisma.$disconnect();
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Add user data to token on sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.full_name = user.full_name;
        token.phone = user.phone;
        token.church_name = user.church_name;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user data to session
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.full_name = token.full_name;
        session.user.phone = token.phone;
        session.user.church_name = token.church_name;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
