'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin';
import { revalidatePath } from 'next/cache';
import { ScholarshipStatus } from '@/types/scholarship';

export async function getScholarshipApplications() {
  await requireAdmin();
  
  const { data, error } = await supabaseAdmin
    .from('scholarship_applications')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    throw new Error('Failed to fetch applications');
  }
  
  return data;
}

export async function updateScholarshipStatus(id: string, status: ScholarshipStatus) {
  await requireAdmin();
  
  const { error } = await supabaseAdmin
    .from('scholarship_applications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
    
  if (error) {
    return { success: false, error: 'Failed to update status' };
  }
  
  revalidatePath('/admin/scholarship');
  return { success: true };
}

export async function updateAdminNotes(id: string, notes: string) {
  await requireAdmin();
  
  const { error } = await supabaseAdmin
    .from('scholarship_applications')
    .update({ admin_notes: notes, updated_at: new Date().toISOString() })
    .eq('id', id);
    
  if (error) {
    return { success: false, error: 'Failed to update notes' };
  }
  
  revalidatePath('/admin/scholarship');
  return { success: true };
}
