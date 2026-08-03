import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Email configuration
console.log('[PartnerEmailService] SMTP Config:', {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  hasUser: !!process.env.SMTP_USER,
  hasPass: !!process.env.SMTP_PASS,
  from: process.env.SMTP_FROM
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export class PartnerEmailService {
  /**
   * Send application received email to applicant
   */
  static async sendApplicationReceivedEmail(applicantEmail: string, applicantName: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@autolearnspot.com',
        to: applicantEmail,
        subject: 'Application Received - AutoLearn Spot Community Partner',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #00f0ff;">Application Received</h2>
            <p>Dear ${applicantName},</p>
            <p>Thank you for applying to become a Community Partner with AutoLearn Spot.</p>
            <p>We have received your application and our team will review it within 2-3 business days.</p>
            <p>You will receive an email notification once a decision has been made.</p>
            <p>If you have any questions, please don't hesitate to reach out.</p>
            <p>Best regards,<br>AutoLearn Spot Team</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);

      // Log email
      await supabaseAdmin.from('partner_email_history').insert({
        recipient_email: applicantEmail,
        email_type: 'application_received',
        subject: 'Application Received - AutoLearn Spot Community Partner',
        status: 'sent',
        metadata: { applicantName }
      });

      return true;
    } catch (error) {
      console.error('[PartnerEmailService] Error sending application received email:', error);
      
      // Log failed email
      await supabaseAdmin.from('partner_email_history').insert({
        recipient_email: applicantEmail,
        email_type: 'application_received',
        subject: 'Application Received - AutoLearn Spot Community Partner',
        status: 'failed',
        metadata: { error: String(error), applicantName }
      });

      return false;
    }
  }

  /**
   * Send application under review email
   */
  static async sendApplicationUnderReviewEmail(applicantEmail: string, applicantName: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@autolearnspot.com',
        to: applicantEmail,
        subject: 'Application Under Review - AutoLearn Spot Community Partner',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #00f0ff;">Application Under Review</h2>
            <p>Dear ${applicantName},</p>
            <p>Your Community Partner application is now under review by our team.</p>
            <p>We are evaluating your application and will get back to you soon with a decision.</p>
            <p>Thank you for your patience.</p>
            <p>Best regards,<br>AutoLearn Spot Team</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);

      await supabaseAdmin.from('partner_email_history').insert({
        recipient_email: applicantEmail,
        email_type: 'application_under_review',
        subject: 'Application Under Review - AutoLearn Spot Community Partner',
        status: 'sent',
        metadata: { applicantName }
      });

      return true;
    } catch (error) {
      console.error('[PartnerEmailService] Error sending under review email:', error);
      return false;
    }
  }

  /**
   * Send application approved email with credentials
   */
  static async sendApplicationApprovedEmail(
    applicantEmail: string, 
    applicantName: string, 
    temporaryPassword: string,
    loginUrl: string,
    dashboardUrl: string,
    commissionRate: number
  ): Promise<boolean> {
    try {
      console.log('[PartnerEmailService] sendApplicationApprovedEmail called with:', {
        applicantEmail,
        applicantName,
        hasPassword: !!temporaryPassword,
        loginUrl,
        dashboardUrl,
        commissionRate
      });

      // Check SMTP configuration
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('[PartnerEmailService] SMTP configuration incomplete:', {
          hasHost: !!process.env.SMTP_HOST,
          hasUser: !!process.env.SMTP_USER,
          hasPass: !!process.env.SMTP_PASS
        });
        
        // Fallback: Queue email for manual processing
        await supabaseAdmin.from('email_queue').insert({
          to: applicantEmail,
          subject: 'Application Approved - Welcome to AutoLearn Spot Partners!',
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #00f0ff;">Congratulations! 🎉</h2>
              <p>Dear ${applicantName},</p>
              <p>We are pleased to inform you that your Community Partner application has been <strong>approved</strong>!</p>
              
              <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Your Partner Account Details</h3>
                <p><strong>Email:</strong> ${applicantEmail}</p>
                <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
                <p><strong>Commission Rate:</strong> ₦${commissionRate} per referral</p>
              </div>
              
              <p><strong>Partner Type:</strong> Community Partner</p>
              <p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
              <p><strong>Dashboard URL:</strong> <a href="${dashboardUrl}">${dashboardUrl}</a></p>
              
              <p>Please log in with your temporary password and change it immediately for security.</p>
              <p><strong>Important:</strong> When logging in, select "Community Partner" as your partner type.</p>
              
              <p>You can now start referring students and earning commissions!</p>
              <p>For every successful student who enrolls in the ₦8,000 course using your referral link, you will earn ₦${commissionRate}.</p>
              
              <p>Best regards,<br>AutoLearn Spot Team</p>
            </div>
          `,
          status: 'pending',
          type: 'application_approved',
          metadata: { applicantName, temporaryPassword, commissionRate, loginUrl, dashboardUrl }
        });

        console.log('[PartnerEmailService] Email queued for manual processing (SMTP not configured)');
        return true; // Return true to prevent blocking the flow
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@autolearnspot.com',
        to: applicantEmail,
        subject: 'Application Approved - Welcome to AutoLearn Spot Partners!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #00f0ff;">Congratulations! 🎉</h2>
            <p>Dear ${applicantName},</p>
            <p>We are pleased to inform you that your Community Partner application has been <strong>approved</strong>!</p>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Your Partner Account Details</h3>
              <p><strong>Email:</strong> ${applicantEmail}</p>
              <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
              <p><strong>Commission Rate:</strong> ₦${commissionRate} per referral</p>
            </div>
            
            <p><strong>Partner Type:</strong> Community Partner</p>
            <p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
            <p><strong>Dashboard URL:</strong> <a href="${dashboardUrl}">${dashboardUrl}</a></p>
            
            <p>Please log in with your temporary password and change it immediately for security.</p>
            <p><strong>Important:</strong> When logging in, select "Community Partner" as your partner type.</p>
            
            <p>You can now start referring students and earning commissions!</p>
            <p>For every successful student who enrolls in the ₦8,000 course using your referral link, you will earn ₦${commissionRate}.</p>
            
            <p>Best regards,<br>AutoLearn Spot Team</p>
          </div>
        `,
      };

      console.log('[PartnerEmailService] Attempting to send email via nodemailer...');
      const info = await transporter.sendMail(mailOptions);
      console.log('[PartnerEmailService] Email sent successfully:', info);

      await supabaseAdmin.from('partner_email_history').insert({
        recipient_email: applicantEmail,
        email_type: 'application_approved',
        subject: 'Application Approved - Welcome to AutoLearn Spot Partners!',
        status: 'sent',
        metadata: { applicantName, commissionRate, messageId: info.messageId }
      });

      return true;
    } catch (error) {
      console.error('[PartnerEmailService] Error sending approval email:', error);
      
      // Fallback: Queue email for manual processing
      try {
        await supabaseAdmin.from('email_queue').insert({
          to: applicantEmail,
          subject: 'Application Approved - Welcome to AutoLearn Spot Partners!',
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #00f0ff;">Congratulations! 🎉</h2>
              <p>Dear ${applicantName},</p>
              <p>We are pleased to inform you that your Community Partner application has been <strong>approved</strong>!</p>
              
              <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Your Partner Account Details</h3>
                <p><strong>Email:</strong> ${applicantEmail}</p>
                <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
                <p><strong>Commission Rate:</strong> ₦${commissionRate} per referral</p>
              </div>
              
              <p><strong>Partner Type:</strong> Community Partner</p>
              <p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
              <p><strong>Dashboard URL:</strong> <a href="${dashboardUrl}">${dashboardUrl}</a></p>
              
              <p>Please log in with your temporary password and change it immediately for security.</p>
              <p><strong>Important:</strong> When logging in, select "Community Partner" as your partner type.</p>
              
              <p>You can now start referring students and earning commissions!</p>
              <p>For every successful student who enrolls in the ₦8,000 course using your referral link, you will earn ₦${commissionRate}.</p>
              
              <p>Best regards,<br>AutoLearn Spot Team</p>
            </div>
          `,
          status: 'pending',
          type: 'application_approved',
          metadata: { applicantName, temporaryPassword, commissionRate, loginUrl, dashboardUrl, error: String(error) }
        });

        console.log('[PartnerEmailService] Email queued for manual processing (SMTP failed)');
        return true; // Return true to prevent blocking the flow
      } catch (logError) {
        console.error('[PartnerEmailService] Failed to queue email:', logError);
      }
      
      // Log failed email attempt
      try {
        await supabaseAdmin.from('partner_email_history').insert({
          recipient_email: applicantEmail,
          email_type: 'application_approved',
          subject: 'Application Approved - Welcome to AutoLearn Spot Partners!',
          status: 'failed',
          metadata: { 
            applicantName, 
            commissionRate, 
            error: String(error),
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      } catch (logError) {
        console.error('[PartnerEmailService] Failed to log email error:', logError);
      }

      return false;
    }
  }

  /**
   * Send application rejected email
   */
  static async sendApplicationRejectedEmail(applicantEmail: string, applicantName: string, reason?: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@autolearnspot.com',
        to: applicantEmail,
        subject: 'Application Update - AutoLearn Spot Community Partner',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #ff6b6b;">Application Update</h2>
            <p>Dear ${applicantName},</p>
            <p>Thank you for your interest in becoming a Community Partner with AutoLearn Spot.</p>
            <p>After careful review, we regret to inform you that your application was not successful at this time.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            <p>We encourage you to apply again in the future when you have more experience or meet our requirements.</p>
            <p>Best regards,<br>AutoLearn Spot Team</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);

      await supabaseAdmin.from('partner_email_history').insert({
        recipient_email: applicantEmail,
        email_type: 'application_rejected',
        subject: 'Application Update - AutoLearn Spot Community Partner',
        status: 'sent',
        metadata: { applicantName, reason }
      });

      return true;
    } catch (error) {
      console.error('[PartnerEmailService] Error sending rejection email:', error);
      return false;
    }
  }

  /**
   * Send need more information email
   */
  static async sendNeedMoreInfoEmail(applicantEmail: string, applicantName: string, notes: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@autolearnspot.com',
        to: applicantEmail,
        subject: 'Additional Information Required - AutoLearn Spot Community Partner',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #ffa500;">Additional Information Required</h2>
            <p>Dear ${applicantName},</p>
            <p>Thank you for your interest in becoming a Community Partner.</p>
            <p>Our team has reviewed your application and requires some additional information to proceed.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Message from our team:</strong></p>
              <p>${notes}</p>
            </div>
            <p>Please respond to this email with the requested information.</p>
            <p>Best regards,<br>AutoLearn Spot Team</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);

      await supabaseAdmin.from('partner_email_history').insert({
        recipient_email: applicantEmail,
        email_type: 'need_more_info',
        subject: 'Additional Information Required - AutoLearn Spot Community Partner',
        status: 'sent',
        metadata: { applicantName, notes }
      });

      return true;
    } catch (error) {
      console.error('[PartnerEmailService] Error sending need info email:', error);
      return false;
    }
  }

  /**
   * Send influencer invitation email
   */
  static async sendInfluencerInvitationEmail(
    influencerEmail: string,
    influencerName: string,
    temporaryPassword: string,
    loginUrl: string,
    dashboardUrl: string,
    commissionRate: number
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@autolearnspot.com',
        to: influencerEmail,
        subject: 'You are invited to be an AutoLearn Spot Influencer Partner!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #00f0ff;">Influencer Partnership Invitation 🌟</h2>
            <p>Dear ${influencerName},</p>
            <p>We are excited to invite you to become an Influencer Partner with AutoLearn Spot!</p>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Your Partner Account Details</h3>
              <p><strong>Email:</strong> ${influencerEmail}</p>
              <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
              <p><strong>Commission Rate:</strong> ₦${commissionRate} per referral</p>
            </div>
            
            <p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
            <p><strong>Dashboard URL:</strong> <a href="${dashboardUrl}">${dashboardUrl}</a></p>
            
            <p>Please log in with your temporary password and change it immediately for security.</p>
            
            <p>As an Influencer Partner, you will earn ₦${commissionRate} for every successful student referral who enrolls in our ₦8,000 course.</p>
            
            <p>We look forward to a successful partnership!</p>
            <p>Best regards,<br>AutoLearn Spot Team</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);

      await supabaseAdmin.from('partner_email_history').insert({
        recipient_email: influencerEmail,
        email_type: 'influencer_invitation',
        subject: 'You are invited to be an AutoLearn Spot Influencer Partner!',
        status: 'sent',
        metadata: { influencerName, commissionRate }
      });

      return true;
    } catch (error) {
      console.error('[PartnerEmailService] Error sending influencer invitation email:', error);
      return false;
    }
  }

  /**
   * Send commission earned notification
   */
  static async sendCommissionEarnedEmail(
    partnerEmail: string,
    partnerName: string,
    amount: number,
    refereeEmail: string
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@autolearnspot.com',
        to: partnerEmail,
        subject: `Commission Earned: ₦${amount} - AutoLearn Spot`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #00f0ff;">Commission Earned! 💰</h2>
            <p>Dear ${partnerName},</p>
            <p>Congratulations! You have earned a commission of <strong>₦${amount}</strong>.</p>
            <p><strong>Referral Details:</strong></p>
            <ul>
              <li>Amount: ₦${amount}</li>
              <li>Referred: ${refereeEmail}</li>
            </ul>
            <p>This commission will be available for withdrawal after the 7-day holding period.</p>
            <p>Log in to your dashboard to view your earnings and request withdrawals.</p>
            <p>Keep up the great work!</p>
            <p>Best regards,<br>AutoLearn Spot Team</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);

      await supabaseAdmin.from('partner_email_history').insert({
        recipient_email: partnerEmail,
        email_type: 'commission_earned',
        subject: `Commission Earned: ₦${amount} - AutoLearn Spot`,
        status: 'sent',
        metadata: { partnerName, amount, refereeEmail }
      });

      return true;
    } catch (error) {
      console.error('[PartnerEmailService] Error sending commission earned email:', error);
      return false;
    }
  }

  /**
   * Send commission released notification
   */
  static async sendCommissionReleasedEmail(
    partnerEmail: string,
    partnerName: string,
    amount: number
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@autolearnspot.com',
        to: partnerEmail,
        subject: `Commission Available: ₦${amount} - AutoLearn Spot`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #00f0ff;">Commission Available for Withdrawal 💸</h2>
            <p>Dear ${partnerName},</p>
            <p>Your commission of <strong>₦${amount}</strong> is now available for withdrawal!</p>
            <p>The 7-day holding period has ended. You can now request a withdrawal from your dashboard.</p>
            <p>Log in to your partner dashboard to request your withdrawal.</p>
            <p>Best regards,<br>AutoLearn Spot Team</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);

      await supabaseAdmin.from('partner_email_history').insert({
        recipient_email: partnerEmail,
        email_type: 'commission_released',
        subject: `Commission Available: ₦${amount} - AutoLearn Spot`,
        status: 'sent',
        metadata: { partnerName, amount }
      });

      return true;
    } catch (error) {
      console.error('[PartnerEmailService] Error sending commission released email:', error);
      return false;
    }
  }

  /**
   * Send withdrawal submitted notification
   */
  static async sendWithdrawalSubmittedEmail(
    partnerEmail: string,
    partnerName: string,
    amount: number
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@autolearnspot.com',
        to: partnerEmail,
        subject: `Withdrawal Request Submitted: ₦${amount} - AutoLearn Spot`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #00f0ff;">Withdrawal Request Submitted</h2>
            <p>Dear ${partnerName},</p>
            <p>Your withdrawal request for <strong>₦${amount}</strong> has been submitted successfully.</p>
            <p>Our team will process your request within 1-2 business days.</p>
            <p>You will receive an email notification when your withdrawal is approved and paid.</p>
            <p>Best regards,<br>AutoLearn Spot Team</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);

      await supabaseAdmin.from('partner_email_history').insert({
        recipient_email: partnerEmail,
        email_type: 'withdrawal_submitted',
        subject: `Withdrawal Request Submitted: ₦${amount} - AutoLearn Spot`,
        status: 'sent',
        metadata: { partnerName, amount }
      });

      return true;
    } catch (error) {
      console.error('[PartnerEmailService] Error sending withdrawal submitted email:', error);
      return false;
    }
  }

  /**
   * Send withdrawal approved notification
   */
  static async sendWithdrawalApprovedEmail(
    partnerEmail: string,
    partnerName: string,
    amount: number
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@autolearnspot.com',
        to: partnerEmail,
        subject: `Withdrawal Approved: ₦${amount} - AutoLearn Spot`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #00f0ff;">Withdrawal Approved ✅</h2>
            <p>Dear ${partnerName},</p>
            <p>Your withdrawal request for <strong>₦${amount}</strong> has been approved!</p>
            <p>Payment is being processed and you should receive the funds in your bank account shortly.</p>
            <p>Thank you for being a valued partner.</p>
            <p>Best regards,<br>AutoLearn Spot Team</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);

      await supabaseAdmin.from('partner_email_history').insert({
        recipient_email: partnerEmail,
        email_type: 'withdrawal_approved',
        subject: `Withdrawal Approved: ₦${amount} - AutoLearn Spot`,
        status: 'sent',
        metadata: { partnerName, amount }
      });

      return true;
    } catch (error) {
      console.error('[PartnerEmailService] Error sending withdrawal approved email:', error);
      return false;
    }
  }

  /**
   * Send withdrawal paid notification
   */
  static async sendWithdrawalPaidEmail(
    partnerEmail: string,
    partnerName: string,
    amount: number,
    paymentReference: string
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@autolearnspot.com',
        to: partnerEmail,
        subject: `Payment Sent: ₦${amount} - AutoLearn Spot`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #00f0ff;">Payment Sent! 🎉</h2>
            <p>Dear ${partnerName},</p>
            <p>Your withdrawal of <strong>₦${amount}</strong> has been paid successfully!</p>
            <p><strong>Payment Reference:</strong> ${paymentReference}</p>
            <p>The funds should now be in your bank account.</p>
            <p>Thank you for your continued partnership with AutoLearn Spot.</p>
            <p>Best regards,<br>AutoLearn Spot Team</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);

      await supabaseAdmin.from('partner_email_history').insert({
        recipient_email: partnerEmail,
        email_type: 'withdrawal_paid',
        subject: `Payment Sent: ₦${amount} - AutoLearn Spot`,
        status: 'sent',
        metadata: { partnerName, amount, paymentReference }
      });

      return true;
    } catch (error) {
      console.error('[PartnerEmailService] Error sending withdrawal paid email:', error);
      return false;
    }
  }

  /**
   * Send withdrawal rejected notification
   */
  static async sendWithdrawalRejectedEmail(
    partnerEmail: string,
    partnerName: string,
    amount: number,
    reason: string
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@autolearnspot.com',
        to: partnerEmail,
        subject: `Withdrawal Rejected: ₦${amount} - AutoLearn Spot`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #ff6b6b;">Withdrawal Request Rejected</h2>
            <p>Dear ${partnerName},</p>
            <p>Your withdrawal request for <strong>₦${amount}</strong> could not be processed.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Reason:</strong> ${reason}</p>
            </div>
            <p>The amount has been returned to your available balance. Please review the reason and submit a new request if needed.</p>
            <p>If you have any questions, please contact our support team.</p>
            <p>Best regards,<br>AutoLearn Spot Team</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);

      await supabaseAdmin.from('partner_email_history').insert({
        recipient_email: partnerEmail,
        email_type: 'withdrawal_rejected',
        subject: `Withdrawal Rejected: ₦${amount} - AutoLearn Spot`,
        status: 'sent',
        metadata: { partnerName, amount, reason }
      });

      return true;
    } catch (error) {
      console.error('[PartnerEmailService] Error sending withdrawal rejected email:', error);
      return false;
    }
  }

  /**
   * Send monthly earnings summary
   */
  static async sendMonthlyEarningsSummary(
    partnerEmail: string,
    partnerName: string,
    month: string,
    year: number,
    totalEarnings: number,
    totalWithdrawals: number,
    referralCount: number
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@autolearnspot.com',
        to: partnerEmail,
        subject: `Monthly Earnings Summary - ${month} ${year} - AutoLearn Spot`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #00f0ff;">Monthly Earnings Summary - ${month} ${year}</h2>
            <p>Dear ${partnerName},</p>
            <p>Here's your performance summary for ${month} ${year}:</p>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Performance Overview</h3>
              <ul>
                <li><strong>Total Earnings:</strong> ₦${totalEarnings.toLocaleString()}</li>
                <li><strong>Total Withdrawals:</strong> ₦${totalWithdrawals.toLocaleString()}</li>
                <li><strong>Successful Referrals:</strong> ${referralCount}</li>
                <li><strong>Available Balance:</strong> ₦${(totalEarnings - totalWithdrawals).toLocaleString()}</li>
              </ul>
            </div>
            
            <p>Thank you for your continued partnership with AutoLearn Spot.</p>
            <p>Keep up the great work!</p>
            <p>Best regards,<br>AutoLearn Spot Team</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);

      await supabaseAdmin.from('partner_email_history').insert({
        recipient_email: partnerEmail,
        email_type: 'monthly_summary',
        subject: `Monthly Earnings Summary - ${month} ${year} - AutoLearn Spot`,
        status: 'sent',
        metadata: { partnerName, month, year, totalEarnings, totalWithdrawals, referralCount }
      });

      return true;
    } catch (error) {
      console.error('[PartnerEmailService] Error sending monthly summary email:', error);
      return false;
    }
  }

  /**
   * Send admin notification for new application
   */
  static async sendAdminNewApplicationNotification(
    adminEmail: string,
    applicantName: string,
    applicantEmail: string,
    applicationId: string
  ): Promise<boolean> {
    try {
      const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://autolearnspot.com'}/admin/growth-center`;

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@autolearnspot.com',
        to: adminEmail,
        subject: 'New Community Partner Application - AutoLearn Spot',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #00f0ff;">New Partner Application</h2>
            <p>A new Community Partner application has been submitted:</p>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Applicant:</strong> ${applicantName}</p>
              <p><strong>Email:</strong> ${applicantEmail}</p>
              <p><strong>Application ID:</strong> ${applicationId}</p>
            </div>
            
            <p><a href="${dashboardUrl}">Review Application in Admin Dashboard</a></p>
            <p>Best regards,<br>AutoLearn Spot System</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);

      return true;
    } catch (error) {
      console.error('[PartnerEmailService] Error sending admin notification:', error);
      return false;
    }
  }

  /**
   * Send admin notification for withdrawal request
   */
  static async sendAdminWithdrawalNotification(
    adminEmail: string,
    partnerName: string,
    amount: number,
    withdrawalId: string
  ): Promise<boolean> {
    try {
      const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://autolearnspot.com'}/admin/growth-center`;

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@autolearnspot.com',
        to: adminEmail,
        subject: `New Withdrawal Request: ₦${amount} - AutoLearn Spot`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #00f0ff;">New Withdrawal Request</h2>
            <p>A new withdrawal request has been submitted:</p>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Partner:</strong> ${partnerName}</p>
              <p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
              <p><strong>Withdrawal ID:</strong> ${withdrawalId}</p>
            </div>
            
            <p><a href="${dashboardUrl}">Process Withdrawal in Admin Dashboard</a></p>
            <p>Best regards,<br>AutoLearn Spot System</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);

      return true;
    } catch (error) {
      console.error('[PartnerEmailService] Error sending admin withdrawal notification:', error);
      return false;
    }
  }
}