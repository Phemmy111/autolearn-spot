/**
 * Clerk Service for Account Management
 * 
 * This service handles Clerk account operations for author onboarding,
 * including creating accounts, sending invitations, and managing user lifecycle.
 * 
 * Note: Since we're using Clerk for authentication, the current implementation
 * handles the case where users already have Clerk accounts from the application process.
 * For true unauthenticated-to-authenticated flow, we'd need Clerk Backend API or webhooks.
 */

import { auth } from '@clerk/nextjs/server';

interface ClerkUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export class ClerkService {
  /**
   * Get current user info from Clerk authentication
   */
  static async getCurrentUser(): Promise<{ success: boolean; user?: ClerkUser; error?: string }> {
    try {
      const { userId } = await auth();
      
      if (!userId) {
        return { success: false, error: 'No authenticated user' };
      }

      const user = await auth().then((auth) => auth.user());
      
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const primaryEmail = user.emailAddresses.find(email => email.id === user.primaryEmailAddressId);
      
      return {
        success: true,
        user: {
          id: userId,
          email: primaryEmail?.emailAddress || '',
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
        },
      };
    } catch (error) {
      console.error('[ClerkService] Error getting current user:', error);
      return { success: false, error: 'Failed to get current user' };
    }
  }

  /**
   * Create author account - placeholder for future implementation
   * 
   * Current implementation: Users are expected to have Clerk accounts already
   * from the application process. This function is kept for future enhancement
   * when we implement unauthenticated application flow.
   */
  static async createAuthorAccount(
    email: string,
    fullName: string
  ): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      // For now, we assume users already have Clerk accounts
      // This is a placeholder for future implementation with Clerk Backend API
      
      console.log('[ClerkService] createAuthorAccount called - assuming user has existing Clerk account');
      
      // In a future implementation, we would:
      // 1. Use Clerk Backend API to create user if they don't exist
      // 2. Send invitation email with magic link
      // 3. Set up webhooks to handle user creation
      // 4. Return the actual Clerk user ID
      
      return { 
        success: true, 
        userId: 'existing_user', // Placeholder - would be actual Clerk user ID
        error: 'This requires Clerk Backend API implementation'
      };
    } catch (error) {
      console.error('[ClerkService] Error in createAuthorAccount:', error);
      return { success: false, error: 'Failed to create author account' };
    }
  }

  /**
   * Check if user has specific role in metadata
   */
  static async hasRole(role: string): Promise<boolean> {
    try {
      const { userId } = await auth();
      if (!userId) return false;

      const user = await auth().then((auth) => auth.user());
      if (!user) return false;

      return user.publicMetadata?.role === role;
    } catch (error) {
      console.error('[ClerkService] Error checking user role:', error);
      return false;
    }
  }

  /**
   * Update user role in metadata
   * Note: This requires Clerk Backend API for server-side updates
   */
  static async updateUserRole(
    userId: string,
    role: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Placeholder for Clerk Backend API implementation
      // This would use the Clerk Backend SDK to update user metadata
      
      console.log('[ClerkService] updateUserRole called - requires Clerk Backend API');
      
      return { 
        success: false, 
        error: 'This requires Clerk Backend API implementation' 
      };
    } catch (error) {
      console.error('[ClerkService] Error updating user role:', error);
      return { success: false, error: 'Failed to update user role' };
    }
  }
}