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

/** Return true if the user has APPROVED or ACTIVE status */
export async function isApprovedAuthor(userId: string): Promise<boolean> {
  const app = await getAuthorApplication(userId);
  if (!app) return false;
  return app.status === 'APPROVED' || app.status === 'ACTIVE';
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
