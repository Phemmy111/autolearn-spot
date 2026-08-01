'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail } from '@/utils/email';
import { ScholarshipFormData } from '@/types/scholarship';
import { revalidatePath } from 'next/cache';
import { 
  logScholarshipEvent, 
  logScholarshipTimeline, 
  logSystemError,
  logEmailEvent 
} from '@/lib/audit-logging';
import { createNotification } from '@/lib/notifications';

// Generate a random 4-digit reference suffix
function generateReference() {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `ALS-${year}-${randomNum}`;
}

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function submitScholarshipApplication(data: ScholarshipFormData) {
  try {
    // Check if an application already exists for this email
    const { data: existingApp, error: checkError } = await supabaseAdmin
      .from('scholarship_applications')
      .select('reference_number, status')
      .eq('email', data.email)
      .limit(1)
      .single();

    // Active statuses that prevent reapplication
    const activeStatuses = ['Submitted', 'Under Review', 'Shortlisted', 'Accepted', 'Payment Pending'];

    if (existingApp && activeStatuses.includes(existingApp.status)) {
      // Email already has an active application
      return {
        success: false,
        error: 'You already have an existing scholarship application.',
        existingReference: existingApp.reference_number,
        existingStatus: existingApp.status,
        requiresStatusCheck: true
      };
    }

    // Ignore checkError if no application found (expected case)
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Database check error:', checkError);
      return { success: false, error: 'Failed to check existing applications. Please try again.' };
    }

    let referenceNumber = generateReference();
    
    // Ensure uniqueness
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 5) {
      const { count } = await supabaseAdmin
        .from('scholarship_applications')
        .select('*', { count: 'exact', head: true })
        .eq('reference_number', referenceNumber);
        
      if (count === 0) {
        isUnique = true;
      } else {
        referenceNumber = generateReference();
        attempts++;
      }
    }
    
    if (!isUnique) {
      throw new Error('Failed to generate unique reference number');
    }

    const applicationData = {
      ...data,
      reference_number: referenceNumber,
      status: 'Submitted',
    };

    const { error: dbError, data: insertedApp } = await supabaseAdmin
      .from('scholarship_applications')
      .insert(applicationData)
      .select('id')
      .single();

    if (dbError) {
      console.error('Database Error:', dbError);
      
      // Log the error
      await logSystemError({
        action: 'application_submission',
        category: 'database_error',
        error_message: dbError.message,
        error_code: dbError.code,
        user_email: data.email,
        metadata: { error_details: dbError },
      });
      
      // Check if it's a unique constraint violation on email
      if (dbError.code === '23505' && dbError.message.includes('email')) {
        const { data: existingApp } = await supabaseAdmin
          .from('scholarship_applications')
          .select('reference_number, status')
          .eq('email', data.email)
          .limit(1)
          .single();
        
        return {
          success: false,
          error: 'An application has already been submitted using this email address. Please use the Check Application Status page to monitor your application.',
          existingReference: existingApp?.reference_number,
          existingStatus: existingApp?.status
        };
      }
      return { success: false, error: 'Failed to submit application. Please try again.' };
    }

    // Log successful application submission
    await logScholarshipEvent({
      action: 'application_submitted',
      category: 'application_submission',
      user_email: data.email,
      application_id: insertedApp.id,
      reference_number: referenceNumber,
      description: `Scholarship application submitted by ${data.full_name}`,
      metadata: {
        full_name: data.full_name,
        country: data.country,
        occupation: data.occupation,
      },
    });

    // Log initial timeline entry
    await logScholarshipTimeline({
      application_id: insertedApp.id,
      reference_number: referenceNumber,
      from_status: undefined,
      to_status: 'Submitted',
      notes: 'Initial application submission',
    } as any);

    // Create in-app notification for applicant
    try {
      await createNotification({
        title: 'Application Received',
        message: `Your scholarship application has been received. Reference: ${referenceNumber}`,
        category: 'payment',
        priority: 'normal',
        target_type: 'student',
        target_id: data.email,
        action_url: '/scholarship/status',
        action_label: 'Check Status',
        send_email: false, // Email is sent separately
        event_id: `scholarship_app_submitted_${insertedApp.id}`,
      });
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
      // Don't fail the application if notification fails
    }

    // Send confirmation email
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
        <h2 style="color: #00f0ff; background: #111; padding: 20px;">AutoLearn Spot Scholarship</h2>
        <p>Hi ${data.full_name},</p>
        <p>We have successfully received your application for the AutoLearn Spot AI Automation Scholarship Programme.</p>
        <p><strong>Your Reference Number: ${referenceNumber}</strong></p>
        <p>Application reviews take approximately 3 days. Please monitor your email for updates regarding your application status.</p>
        <br/>
        <p>Best regards,<br/>The AutoLearn Spot Team</p>
      </div>
    `;

    try {
      await sendEmail({
        to: data.email,
        subject: `Application Received: ${referenceNumber}`,
        html: emailHtml,
      });

      // Log successful email
      await logEmailEvent({
        action: 'application_confirmation_email',
        recipient_email: data.email,
        email_type: 'application_received',
        subject: `Application Received: ${referenceNumber}`,
        description: `Application confirmation email sent to ${data.email}`,
        status: 'success',
      });
    } catch (emailError: any) {
      // Log failed email
      await logEmailEvent({
        action: 'application_confirmation_email',
        recipient_email: data.email,
        email_type: 'application_received',
        subject: `Application Received: ${referenceNumber}`,
        description: `Failed to send application confirmation email to ${data.email}`,
        status: 'failure',
        error_message: emailError.message,
      });
      throw emailError;
    }

    return { success: true, referenceNumber };
  } catch (err: any) {
    console.error('Submission Error:', err);
    return { success: false, error: err.message || 'An unexpected error occurred' };
  }
}

export async function requestStatusOTP(email: string) {
  try {
    // Check if email exists
    const { data: apps, error: checkError } = await supabaseAdmin
      .from('scholarship_applications')
      .select('id')
      .eq('email', email)
      .limit(1);
      
    if (checkError) {
      await logSystemError({
        action: 'otp_request',
        category: 'database_error',
        error_message: checkError.message,
        user_email: email,
      });
      return { success: false, error: 'Failed to verify email.' };
    }
    
    if (!apps || apps.length === 0) {
      // Don't leak whether email exists or not for security, just say we sent it if it exists.
      return { success: true };
    }

    const otp = generateOTP();
    // OTP expires in 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60000).toISOString();

    const { error: otpError } = await supabaseAdmin
      .from('scholarship_otps')
      .insert({
        email,
        otp_code: otp,
        expires_at: expiresAt,
      });

    if (otpError) {
      console.error('OTP DB Error:', otpError);
      console.error('OTP Error Details:', JSON.stringify(otpError, null, 2));
      
      await logSystemError({
        action: 'otp_generation',
        category: 'database_error',
        error_message: otpError.message,
        error_code: otpError.code,
        user_email: email,
      });
      
      return { success: false, error: `Database error: ${otpError.message}` };
    }

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
        <h2 style="color: #00f0ff; background: #111; padding: 20px;">AutoLearn Spot Verification</h2>
        <p>Your verification code for checking application status is:</p>
        <h1 style="font-size: 32px; letter-spacing: 5px; color: #00363a;">${otp}</h1>
        <p>This code expires in 15 minutes.</p>
      </div>
    `;

    try {
      await sendEmail({
        to: email,
        subject: 'Your Status Verification Code',
        html: emailHtml,
      });

      await logEmailEvent({
        action: 'otp_email',
        recipient_email: email,
        email_type: 'status_verification',
        subject: 'Your Status Verification Code',
        description: `OTP verification email sent to ${email}`,
        status: 'success',
      });
    } catch (emailError: any) {
      console.error('Email send error:', emailError);
      
      await logEmailEvent({
        action: 'otp_email',
        recipient_email: email,
        email_type: 'status_verification',
        subject: 'Your Status Verification Code',
        description: `Failed to send OTP email to ${email}`,
        status: 'failure',
        error_message: emailError.message,
      });
      
      // OTP was stored successfully, but email failed
      return { success: false, error: `Email delivery failed: ${emailError.message}` };
    }

    return { success: true };
  } catch (err: any) {
    console.error('OTP Request Error:', err);
    
    await logSystemError({
      action: 'otp_request',
      category: 'api_error',
      error_message: err.message,
      user_email: email,
    });
    
    return { success: false, error: `Unexpected error: ${err.message}` };
  }
}

export async function verifyOTPAndGetStatus(email: string, otp: string) {
  try {
    // Find valid OTP
    const { data: otpRecords, error: otpError } = await supabaseAdmin
      .from('scholarship_otps')
      .select('*')
      .eq('email', email)
      .eq('otp_code', otp)
      .eq('is_used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (otpError || !otpRecords || otpRecords.length === 0) {
      return { success: false, error: 'Invalid or expired verification code.' };
    }

    // Mark as used
    await supabaseAdmin
      .from('scholarship_otps')
      .update({ is_used: true })
      .eq('id', otpRecords[0].id);

    // Get application
    const { data: apps, error: appError } = await supabaseAdmin
      .from('scholarship_applications')
      .select('reference_number, status, full_name, payment_status')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1);

    if (appError || !apps || apps.length === 0) {
      return { success: false, error: 'Application not found.' };
    }

    return { 
      success: true, 
      data: {
        reference_number: apps[0].reference_number,
        status: apps[0].status,
        full_name: apps[0].full_name,
        payment_status: apps[0].payment_status,
      }
    };
  } catch (err: any) {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function markPaymentPending(email: string) {
  try {
    const { error } = await supabaseAdmin
      .from('scholarship_applications')
      .update({ 
        payment_status: 'Pending Verification',
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .eq('status', 'Accepted');

    if (error) {
      console.error('Payment pending error:', error);
      return { success: false, error: 'Failed to mark payment as pending.' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Payment pending error:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
