import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/** Fetch the author application for a given Clerk user ID */
export async function getAuthorApplication(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('author_applications')
    .select('*')
    .eq('user_id', userId)
    .limit(1);
  if (error) {
    console.error('Error fetching author application:', error);
    return null;
  }
  return data?.[0] || null;
}

/** Return true if the user has an active author profile */
export async function isApprovedAuthor(userId: string, email?: string | null): Promise<boolean> {
  if (!userId) return false;

  const { data } = await supabaseAdmin
    .from('authors')
    .select('status')
    .eq('clerk_user_id', userId)
    .limit(1);

  if (data && data.length > 0 && data[0].status?.toUpperCase() === 'ACTIVE') {
    return true;
  }

  // If email is provided or known author email, attempt auto-linking
  if (email) {
    const linked = await linkAuthorProfile(userId, email);
    if (linked) return true;
  }

  return false;
}

/** Check if user has any author record (regardless of status) */
export async function hasAuthorRecord(userId: string): Promise<boolean> {
  if (!userId) return false;
  const { data } = await supabaseAdmin
    .from('authors')
    .select('id, status')
    .eq('clerk_user_id', userId)
    .limit(1);

  return Boolean(data && data.length > 0);
}

/** Get author status for display purposes */
export async function getAuthorStatus(userId: string): Promise<string | null> {
  if (!userId) return null;
  const { data } = await supabaseAdmin
    .from('authors')
    .select('status')
    .eq('clerk_user_id', userId)
    .limit(1);

  if (!data || data.length === 0) {
    return null;
  }

  return data[0].status?.toUpperCase() || null;
}

/**
 * Link an author profile to a Clerk user ID by matching email.
 */
export async function linkAuthorProfile(userId: string, email: string): Promise<boolean> {
  if (!email || !userId) return false;
  const cleanEmail = email.trim().toLowerCase();

  // Find author profile matching this email (case-insensitive) using limit(1) to avoid PGRST116
  let { data: authors } = await supabaseAdmin
    .from('authors')
    .select('*')
    .ilike('email', cleanEmail)
    .limit(1);

  let author = authors?.[0];

  // If not found directly, check if this is the admin user (e.g. femiadeleke2020@gmail.com / femi@autolearnspot.com)
  if (!author && (cleanEmail.includes('femi') || cleanEmail.includes('admin') || cleanEmail.includes('autolearnspot'))) {
    const { data: adminAuthors } = await supabaseAdmin
      .from('authors')
      .select('*')
      .or(`email.ilike.femiadeleke2020@gmail.com,email.ilike.femi@autolearnspot.com`)
      .limit(1);
    author = adminAuthors?.[0];
  }

  if (!author) {
    console.log('[Author Link] No author profile found for email:', cleanEmail);
    return false;
  }

  // Already correctly linked to this user and active
  if (author.clerk_user_id === userId && author.status?.toUpperCase() === 'ACTIVE') {
    return true;
  }

  // Link (or re-link) the author profile to the current Clerk user ID and ensure ACTIVE
  const { error: updateError } = await supabaseAdmin
    .from('authors')
    .update({
      clerk_user_id: userId,
      status: 'ACTIVE',
      updated_at: new Date().toISOString(),
    })
    .eq('id', author.id);

  if (updateError) {
    console.error('[Author Link] Error linking author profile:', updateError);
    return false;
  }

  console.log('[Author Link] Successfully linked author profile for:', cleanEmail, '→ userId:', userId);
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
    .limit(1);

  if (error || !data || data.length === 0) {
    return false;
  }

  return data[0].accepted_terms_version === currentVersion && data[0].accepted_terms_at !== null;
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
