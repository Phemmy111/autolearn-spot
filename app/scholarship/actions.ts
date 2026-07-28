'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail } from '@/utils/email';
import { ScholarshipFormData } from '@/types/scholarship';
import { revalidatePath } from 'next/cache';

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

    const { error: dbError } = await supabaseAdmin
      .from('scholarship_applications')
      .insert(applicationData);

    if (dbError) {
      console.error('Database Error:', dbError);
      return { success: false, error: 'Failed to submit application. Please try again.' };
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

    await sendEmail({
      to: data.email,
      subject: `Application Received: ${referenceNumber}`,
      html: emailHtml,
    });

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
      return { success: false, error: 'Failed to generate verification code.' };
    }

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
        <h2 style="color: #00f0ff; background: #111; padding: 20px;">AutoLearn Spot Verification</h2>
        <p>Your verification code for checking application status is:</p>
        <h1 style="font-size: 32px; letter-spacing: 5px; color: #00363a;">${otp}</h1>
        <p>This code expires in 15 minutes.</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: 'Your Status Verification Code',
      html: emailHtml,
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: 'An unexpected error occurred' };
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
      .select('reference_number, status, full_name')
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
      }
    };
  } catch (err: any) {
    return { success: false, error: 'An unexpected error occurred' };
  }
}
