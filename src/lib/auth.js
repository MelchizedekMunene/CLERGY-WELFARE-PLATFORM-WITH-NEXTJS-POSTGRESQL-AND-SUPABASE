// Authentication utility functions
// Shared helpers for auth operations across the application

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * Get the current user session on the server
 * @returns {Promise<Object|null>} - User session or null if not authenticated
 */
export async function getCurrentSession() {
  try {
    const session = await getServerSession(authOptions);
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Get the current authenticated user from the database
 * @returns {Promise<Object|null>} - Complete user object or null
 */
export async function getCurrentUser() {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        church_name: true,
        role: true,
        is_active: true,
        registration_date: true,
        created_at: true,
        updated_at: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Check if current user has admin role
 * @returns {Promise<boolean>} - True if user is admin
 */
export async function isAdmin() {
  try {
    const session = await getCurrentSession();
    return session?.user?.role === 'ADMIN';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Check if current user has a specific role
 * @param {string} requiredRole - The role to check against
 * @returns {Promise<boolean>} - True if user has the required role
 */
export async function hasRole(requiredRole) {
  try {
    const session = await getCurrentSession();
    return session?.user?.role === requiredRole;
  } catch (error) {
    console.error('Error checking role:', error);
    return false;
  }
}

/**
 * Get user by ID from database
 * @param {string} userId - The user ID to fetch
 * @returns {Promise<Object|null>} - User object or null if not found
 */
export async function getUserById(userId) {
  try {
    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        church_name: true,
        role: true,
        is_active: true,
        registration_date: true,
        created_at: true,
        updated_at: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return null;
  }
}

/**
 * Get all members (non-admin users)
 * @returns {Promise<Array>} - Array of member users
 */
export async function getAllMembers() {
  try {
    const members = await prisma.user.findMany({
      where: { role: 'MEMBER' },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        church_name: true,
        role: true,
        is_active: true,
        registration_date: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return members;
  } catch (error) {
    console.error('Error fetching members:', error);
    return [];
  }
}

/**
 * Get all admins
 * @returns {Promise<Array>} - Array of admin users
 */
export async function getAllAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        church_name: true,
        role: true,
        is_active: true,
        registration_date: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return admins;
  } catch (error) {
    console.error('Error fetching admins:', error);
    return [];
  }
}

/**
 * Deactivate a user account
 * @param {string} userId - The user ID to deactivate
 * @returns {Promise<Object|null>} - Updated user or null if failed
 */
export async function deactivateUser(userId) {
  try {
    // Check if requester is admin
    if (!(await isAdmin())) {
      throw new Error('Only admins can deactivate users');
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { is_active: false },
      select: {
        id: true,
        email: true,
        is_active: true,
        role: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Error deactivating user:', error);
    return null;

  }
}

/**
 * Activate a user account
 * @param {string} userId - The user ID to activate
 * @returns {Promise<Object|null>} - Updated user or null if failed
 */
export async function activateUser(userId) {
  try {
    // Check if requester is admin
    if (!(await isAdmin())) {
      throw new Error('Only admins can activate users');
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { is_active: true },
      select: {
        id: true,
        email: true,
        is_active: true,
        role: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Error activating user:', error);
    return null;
  }
}

/**
 * Update user profile information
 * @param {string} userId - The user ID to update
 * @param {Object} updates - Object containing fields to update
 * @returns {Promise<Object|null>} - Updated user or null if failed
 */
export async function updateUserProfile(userId, updates) {
  try {
    // Get current session to verify permissions
    const session = await getCurrentSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Users can only update their own profile unless they're admin
    if (session.user.id !== userId && session.user.role !== 'ADMIN') {
      throw new Error('Insufficient permissions');
    }

    // Don't allow updating sensitive fields
    const allowedUpdates = {
      full_name: updates.full_name,
      phone: updates.phone,
      church_name: updates.church_name,
    };

    // Remove undefined values
    Object.keys(allowedUpdates).forEach(
      (key) => allowedUpdates[key] === undefined && delete allowedUpdates[key]
    );

    if (Object.keys(allowedUpdates).length === 0) {
      throw new Error('No valid fields to update');
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: allowedUpdates,
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        church_name: true,
        role: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
}

export default {
  getCurrentSession,
  getCurrentUser,
  isAdmin,
  hasRole,
  getUserById,
  getAllMembers,
  getAllAdmins,
  deactivateUser,
  activateUser,
  updateUserProfile,
};
