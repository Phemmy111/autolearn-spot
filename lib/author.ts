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

/** Check if user has any author record (regardless of status) */
export async function hasAuthorRecord(userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('authors')
    .select('id, status')
    .eq('clerk_user_id', userId)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

/** Get author status for display purposes */
export async function getAuthorStatus(userId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('authors')
    .select('status')
    .eq('clerk_user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.status;
}

/**
 * Link an author profile to a Clerk user ID by matching email.
 *
 * Handles three cases:
 * 1. Author record exists with clerk_user_id = null → link it
 * 2. Author record already linked to THIS userId → already correct, return true
 * 3. Author record linked to a DIFFERENT userId (e.g. from incognito) → re-link to current userId
 */
export async function linkAuthorProfile(userId: string, email: string): Promise<boolean> {
  if (!email) return false;

  // Find any author profile matching this email (regardless of clerk_user_id)
  const { data: author, error } = await supabaseAdmin
    .from('authors')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !author) {
    console.log('[Author Link] No author profile found for email:', email);
    return false;
  }

  // Already correctly linked to this user — nothing to do
  if (author.clerk_user_id === userId) {
    console.log('[Author Link] Already linked to this userId:', userId);
    return true;
  }

  // Link (or re-link) the author profile to the current Clerk user ID
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

  console.log('[Author Link] Successfully linked author profile for:', email, '→ userId:', userId);
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

/** Check if author has accepted the current terms version */
export async function hasAcceptedCurrentTerms(userId: string, currentVersion: string = '2026-09-01'): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('authors')
    .select('accepted_terms_version, accepted_terms_at')
    .eq('clerk_user_id', userId)
    .single();

  if (error || !data) {
    return false;
  }

  return data.accepted_terms_version === currentVersion && data.accepted_terms_at !== null;
}

/** Server-side guard to ensure author has accepted current terms */
export async function requireAcceptedTerms(currentVersion: string = '2026-09-01') {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hasAccepted = await hasAcceptedCurrentTerms(userId, currentVersion);
  if (!hasAccepted) {
    return NextResponse.json(
      { 
        error: 'Terms acceptance required',
        message: 'You must accept the current Author Terms & Conditions before creating products.',
        redirectTo: '/author/terms'
      }, 
      { status: 403 }
    );
  }

  return { userId };
}
