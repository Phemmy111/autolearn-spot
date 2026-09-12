import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/** Fetch the author application for a given Clerk user ID */
export async function getAuthorApplication(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('author_applications')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching author application:', error);
    throw error;
  }
  return data || null;
}

/** Return true if the user has an active author profile */
export async function isApprovedAuthor(userId: string): Promise<boolean> {
  // Check if user has an active author profile in the authors table
  const { data, error } = await supabaseAdmin
    .from('authors')
    .select('status')
    .eq('clerk_user_id', userId)
    .single();

  if (error || !data) {
    return false;
  }

  return data.status === 'ACTIVE';
}

/** Link author profile to Clerk user ID after account creation */
export async function linkAuthorProfile(userId: string, email: string): Promise<boolean> {
  // Find author profile by email (for users who applied without auth)
  const { data: author, error } = await supabaseAdmin
    .from('authors')
    .select('*')
    .eq('email', email)
    .is('clerk_user_id', null)
    .single();

  if (error || !author) {
    console.log('[Author Link] No unlinked author profile found for email:', email);
    return false;
  }

  // Update the author profile with the Clerk user ID
  const { error: updateError } = await supabaseAdmin
    .from('authors')
    .update({
      clerk_user_id: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', author.id);

  if (updateError) {
    console.error('[Author Link] Error linking author profile:', updateError);
    return false;
  }

  console.log('[Author Link] Successfully linked author profile for:', email);
  return true;
}

/** Server-side guard for author-only routes */
export async function requireAuthor() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const approved = await isApprovedAuthor(userId);
  if (!approved) {
    return NextResponse.json({ error: 'Forbidden: author access required' }, { status: 403 });
  }
  return { userId };
}
