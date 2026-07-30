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
import { 
  logAdminActivity, 
  logScholarshipTimeline, 
  logSystemError,
  logEmailEvent,
  getScholarshipTimeline 
} from '@/lib/audit-logging';
import { auth } from '@clerk/nextjs/server';
import { createNotification } from '@/lib/notifications';

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

export async function getApplicationTimeline(applicationId: string) {
  await requireAdmin();
  
  try {
    const timeline = await getScholarshipTimeline(applicationId);
    return timeline;
  } catch (error) {
    console.error('Failed to fetch application timeline:', error);
    return [];
  }
}

export async function updateScholarshipStatus(id: string, status: ScholarshipStatus) {
  await requireAdmin();
  
  // Get admin info
  const { userId } = await auth();
  const adminInfo = userId ? { admin_id: userId } : {};
  
  // Fetch application details before updating
  const { data: application, error: fetchError } = await supabaseAdmin
    .from('scholarship_applications')
    .select('email, full_name, reference_number, status')
    .eq('id', id)
    .single();
    
  if (fetchError) {
    await logSystemError({
      action: 'status_update',
      category: 'database_error',
      error_message: fetchError.message,
      resource_type: 'scholarship_application',
      resource_id: id,
    });
    return { success: false, error: 'Failed to fetch application' };
  }
  
  const previousStatus = application.status;
  
  const { error } = await supabaseAdmin
    .from('scholarship_applications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
    
  if (error) {
    await logSystemError({
      action: 'status_update',
      category: 'database_error',
      error_message: error.message,
      resource_type: 'scholarship_application',
      resource_id: id,
      ...adminInfo,
    });
    return { success: false, error: 'Failed to update status' };
  }
  
  // Log admin activity
  await logAdminActivity({
    action: 'status_changed',
    admin_id: userId,
    admin_email: userId ? 'admin' : undefined,
    resource_type: 'scholarship_application',
    resource_id: id,
    resource_reference: application.reference_number,
    description: `Changed status from ${previousStatus} to ${status} for ${application.full_name}`,
    metadata: {
      previous_status: previousStatus,
      new_status: status,
      applicant_name: application.full_name,
    },
  });
  
  // Log timeline entry
  await logScholarshipTimeline({
    application_id: id,
    reference_number: application.reference_number,
    from_status: previousStatus,
    to_status: status,
    admin_id: userId,
    reason: 'Admin status change',
  });

  // Create in-app notification for applicant
  try {
    const notificationData = {
      title: 'Application Status Updated',
      message: `Your scholarship application status has been updated to: ${status}`,
      category: 'payment' as const,
      priority: 'important' as const,
      target_type: 'student' as const,
      target_id: application.email,
      action_url: '/scholarship/status',
      action_label: 'Check Status',
      send_email: false, // Email is sent separately
      event_id: `scholarship_status_${id}_${status}`,
    };

    // Customize message based on status
    switch (status) {
      case 'Under Review':
        notificationData.title = 'Application Under Review';
        notificationData.message = 'Your scholarship application is now under review. We will notify you of the decision soon.';
        notificationData.priority = 'normal';
        break;
      case 'Shortlisted':
        notificationData.title = 'Application Shortlisted';
        notificationData.message = 'Congratulations! Your application has been shortlisted. We will contact you with next steps.';
        notificationData.priority = 'important';
        break;
      case 'Accepted':
        notificationData.title = 'Application Accepted';
        notificationData.message = 'Congratulations! Your scholarship application has been accepted. Please complete the payment process.';
        notificationData.priority = 'urgent';
        break;
      case 'Waitlisted':
        notificationData.title = 'Application Waitlisted';
        notificationData.message = 'Your application has been placed on the waitlist. We will contact you if a spot becomes available.';
        notificationData.priority = 'normal';
        break;
      case 'Not Selected':
        notificationData.title = 'Application Not Selected';
        notificationData.message = 'Thank you for your interest. Unfortunately, your application was not selected for this cohort.';
        notificationData.priority = 'normal';
        break;
    }

    await createNotification(notificationData);
  } catch (notifError) {
    console.error('Failed to create notification:', notifError);
    // Don't fail the status update if notification fails
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
        await logEmailEvent({
          action: 'status_email',
          recipient_email: application.email,
          email_type: 'under_review',
          subject: 'Application Under Review',
          description: `Under review email sent to ${application.email}`,
          status: 'success',
        });
        break;
      case 'Shortlisted':
        await sendShortlistedEmail(emailData);
        await logEmailEvent({
          action: 'status_email',
          recipient_email: application.email,
          email_type: 'shortlisted',
          subject: 'Application Shortlisted',
          description: `Shortlisted email sent to ${application.email}`,
          status: 'success',
        });
        break;
      case 'Accepted':
        await sendAcceptedEmail(emailData);
        await logEmailEvent({
          action: 'status_email',
          recipient_email: application.email,
          email_type: 'accepted',
          subject: 'Application Accepted',
          description: `Accepted email sent to ${application.email}`,
          status: 'success',
        });
        break;
      case 'Waitlisted':
        await sendWaitlistedEmail(emailData);
        await logEmailEvent({
          action: 'status_email',
          recipient_email: application.email,
          email_type: 'waitlisted',
          subject: 'Application Waitlisted',
          description: `Waitlisted email sent to ${application.email}`,
          status: 'success',
        });
        break;
      case 'Not Selected':
        await sendNotSelectedEmail(emailData);
        await logEmailEvent({
          action: 'status_email',
          recipient_email: application.email,
          email_type: 'not_selected',
          subject: 'Application Not Selected',
          description: `Not selected email sent to ${application.email}`,
          status: 'success',
        });
        break;
      default:
        // No email for other statuses
        break;
    }
  } catch (emailError: any) {
    console.error('Failed to send status email:', emailError);
    await logEmailEvent({
      action: 'status_email',
      recipient_email: application.email,
      email_type: status.toLowerCase().replace(' ', '_'),
      subject: `Status Update: ${status}`,
      description: `Failed to send status email to ${application.email}`,
      status: 'failure',
      error_message: emailError.message,
    });
    // Don't fail the status update if email fails
  }
  
  revalidatePath('/admin/scholarship');
  return { success: true };
}

export async function updateAdminNotes(id: string, notes: string) {
  await requireAdmin();
  
  // Get admin info
  const { userId } = await auth();
  
  // Fetch application details
  const { data: application, error: fetchError } = await supabaseAdmin
    .from('scholarship_applications')
    .select('reference_number, full_name')
    .eq('id', id)
    .single();
    
  if (fetchError) {
    await logSystemError({
      action: 'notes_update',
      category: 'database_error',
      error_message: fetchError.message,
      resource_type: 'scholarship_application',
      resource_id: id,
    });
    return { success: false, error: 'Failed to fetch application' };
  }
  
  const { error } = await supabaseAdmin
    .from('scholarship_applications')
    .update({ admin_notes: notes, updated_at: new Date().toISOString() })
    .eq('id', id);
    
  if (error) {
    await logSystemError({
      action: 'notes_update',
      category: 'database_error',
      error_message: error.message,
      resource_type: 'scholarship_application',
      resource_id: id,
    });
    return { success: false, error: 'Failed to update notes' };
  }
  
  // Log admin activity
  await logAdminActivity({
    action: 'notes_updated',
    admin_id: userId,
    resource_type: 'scholarship_application',
    resource_id: id,
    resource_reference: application.reference_number,
    description: `Updated admin notes for ${application.full_name}`,
    metadata: {
      notes_length: notes.length,
      applicant_name: application.full_name,
    },
  });
  
  revalidatePath('/admin/scholarship');
  return { success: true };
}

export async function updatePaymentStatus(id: string, paymentStatus: string, notes?: string) {
  await requireAdmin();
  
  // Get admin info
  const { userId } = await auth();
  
  // Fetch application details before updating
  const { data: application, error: fetchError } = await supabaseAdmin
    .from('scholarship_applications')
    .select('email, full_name, reference_number, payment_status')
    .eq('id', id)
    .single();
    
  if (fetchError) {
    await logSystemError({
      action: 'payment_status_update',
      category: 'database_error',
      error_message: fetchError.message,
      resource_type: 'scholarship_application',
      resource_id: id,
    });
    return { success: false, error: 'Failed to fetch application' };
  }
  
  const previousPaymentStatus = application.payment_status;
  
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
    await logSystemError({
      action: 'payment_status_update',
      category: 'database_error',
      error_message: error.message,
      resource_type: 'scholarship_application',
      resource_id: id,
    });
    return { success: false, error: 'Failed to update payment status' };
  }
  
  // Log admin activity
  await logAdminActivity({
    action: 'payment_status_changed',
    admin_id: userId,
    resource_type: 'scholarship_application',
    resource_id: id,
    resource_reference: application.reference_number,
    description: `Changed payment status from ${previousPaymentStatus} to ${paymentStatus} for ${application.full_name}`,
    metadata: {
      previous_payment_status: previousPaymentStatus,
      new_payment_status: paymentStatus,
      applicant_name: application.full_name,
    },
  });
  
  // Send welcome email if payment is verified and wasn't verified before
  if (paymentStatus === 'Verified' && application.payment_status !== 'Verified') {
    try {
      await sendWelcomeEmail({
        to: application.email,
        fullName: application.full_name,
        referenceNumber: application.reference_number,
      });
      
      await logEmailEvent({
        action: 'welcome_email',
        recipient_email: application.email,
        email_type: 'welcome',
        subject: 'Welcome to AutoLearn Spot',
        description: `Welcome email sent to ${application.email} (manual verification)`,
        status: 'success',
      });
    } catch (emailError: any) {
      console.error('Failed to send welcome email:', emailError);
      
      await logEmailEvent({
        action: 'welcome_email',
        recipient_email: application.email,
        email_type: 'welcome',
        subject: 'Welcome to AutoLearn Spot',
        description: `Failed to send welcome email to ${application.email}`,
        status: 'failure',
        error_message: emailError.message,
      });
      // Don't fail the payment update if email fails
    }
  }
  
  revalidatePath('/admin/scholarship');
  return { success: true };
}
