'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin';
import { revalidatePath } from 'next/cache';
import { ScholarshipStatus } from '@/types/scholarship';
import {
  sendUnderReviewEmail,
  sendShortlistedEmail,
  sendAcceptedEmail,
  sendWaitlistedEmail,
  sendNotSelectedEmail,
  sendWelcomeEmail,
} from '@/lib/scholarship-emails';

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
  
  // Fetch application details before updating
  const { data: application, error: fetchError } = await supabaseAdmin
    .from('scholarship_applications')
    .select('email, full_name, reference_number, status')
    .eq('id', id)
    .single();
    
  if (fetchError) {
    return { success: false, error: 'Failed to fetch application' };
  }
  
  const { error } = await supabaseAdmin
    .from('scholarship_applications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
    
  if (error) {
    return { success: false, error: 'Failed to update status' };
  }
  
  // Send appropriate email based on new status
  try {
    const emailData = {
      to: application.email,
      fullName: application.full_name,
      referenceNumber: application.reference_number,
    };
    
    switch (status) {
      case 'Under Review':
        await sendUnderReviewEmail(emailData);
        break;
      case 'Shortlisted':
        await sendShortlistedEmail(emailData);
        break;
      case 'Accepted':
        await sendAcceptedEmail(emailData);
        break;
      case 'Waitlisted':
        await sendWaitlistedEmail(emailData);
        break;
      case 'Not Selected':
        await sendNotSelectedEmail(emailData);
        break;
      default:
        // No email for other statuses
        break;
    }
  } catch (emailError) {
    console.error('Failed to send status email:', emailError);
    // Don't fail the status update if email fails
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

export async function updatePaymentStatus(id: string, paymentStatus: string, notes?: string) {
  await requireAdmin();
  
  // Fetch application details before updating
  const { data: application, error: fetchError } = await supabaseAdmin
    .from('scholarship_applications')
    .select('email, full_name, reference_number, payment_status')
    .eq('id', id)
    .single();
    
  if (fetchError) {
    return { success: false, error: 'Failed to fetch application' };
  }
  
  const updateData: any = {
    payment_status: paymentStatus,
    updated_at: new Date().toISOString(),
  };
  
  if (notes !== undefined) {
    updateData.payment_notes = notes;
  }
  
  if (paymentStatus === 'Verified') {
    updateData.payment_date = new Date().toISOString();
  }
  
  const { error } = await supabaseAdmin
    .from('scholarship_applications')
    .update(updateData)
    .eq('id', id);
    
  if (error) {
    return { success: false, error: 'Failed to update payment status' };
  }
  
  // Send welcome email if payment is verified and wasn't verified before
  if (paymentStatus === 'Verified' && application.payment_status !== 'Verified') {
    try {
      await sendWelcomeEmail({
        to: application.email,
        fullName: application.full_name,
        referenceNumber: application.reference_number,
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the payment update if email fails
    }
  }
  
  revalidatePath('/admin/scholarship');
  return { success: true };
}
