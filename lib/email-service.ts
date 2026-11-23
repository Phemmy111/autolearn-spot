/**
 * Email Notification Service
 * 
 * This service handles sending emails for author application status changes
 * and other author-related notifications using Nodemailer.
 * 
 * Uses the same SMTP configuration as existing services (partners, scholarship, etc.)
 */

import nodemailer from 'nodemailer';
import { supabaseAdmin } from '@/lib/supabase';

interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailTemplateMultiple {
  to: string[];
  subject: string;
  html: string;
  text?: string;
}

// Email configuration - matching existing pattern
console.log('[EmailService] SMTP Config:', {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  hasUser: !!process.env.SMTP_USER,
  hasPass: !!process.env.SMTP_PASS,
  from: process.env.SMTP_FROM
});

function getEmailCredentials() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const isSecure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;
  const from = process.env.SMTP_FROM || (user ? `"AutoLearn Spot" <${user}>` : '"AutoLearn Spot" <autolearnspot@gmail.com>');

  return { host, port, isSecure, user, pass, from };
}

function getTransporter() {
  const { host, port, isSecure, user, pass } = getEmailCredentials();
  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: {
      user,
      pass,
    },
  });
}

export class EmailService {

  /**
   * Send an email - using the same pattern as existing services
   */
  private static async sendEmail(template: EmailTemplate): Promise<boolean> {
    const creds = getEmailCredentials();

    if (!creds.user || !creds.pass) {
      console.warn('[EmailService] SMTP credentials not configured (SMTP_USER/SMTP_PASS missing in environment). Email logged only:', {
        to: template.to,
        subject: template.subject,
      });
      return false;
    }

    try {
      const transporter = getTransporter();
      const mailOptions = {
        from: creds.from,
        to: template.to,
        subject: template.subject,
        html: template.html,
        text: template.text,
      };

      const info = await transporter.sendMail(mailOptions);

      console.log('[EmailService] Email sent successfully:', {
        to: template.to,
        subject: template.subject,
        messageId: info.messageId,
      });

      return true;
    } catch (error) {
      console.error('[EmailService] Failed to send email:', error);

      // Fallback to logging if email fails
      console.log('[EmailService] Email fallback (logging):', {
        to: template.to,
        subject: template.subject,
      });

      return false;
    }
  }

  /**
   * Send emails to multiple recipients
   */
  private static async sendEmailMultiple(template: EmailTemplateMultiple): Promise<boolean> {
    const creds = getEmailCredentials();

    if (!creds.user || !creds.pass) {
      console.warn('[EmailService] SMTP credentials not configured. Email logged only:', {
        to: template.to,
        subject: template.subject,
      });
      return false;
    }

    if (!template.to || template.to.length === 0) {
      console.warn('[EmailService] No recipients provided for sendEmailMultiple:', template.subject);
      return false;
    }

    try {
      const transporter = getTransporter();
      const mailOptions = {
        from: creds.from,
        to: template.to.join(','),
        subject: template.subject,
        html: template.html,
        text: template.text,
      };

      const info = await transporter.sendMail(mailOptions);

      console.log('[EmailService] Email sent successfully to multiple recipients:', {
        to: template.to,
        subject: template.subject,
        messageId: info.messageId,
      });

      return true;
    } catch (error) {
      console.error('[EmailService] Failed to send email to multiple recipients:', error);

      // Fallback to logging if email fails
      console.log('[EmailService] Email fallback (logging):', {
        to: template.to,
        subject: template.subject,
      });

      return false;
    }
  }

  /**
   * Get email recipients for a specific event from database configuration
   */
  private static async getEventRecipients(eventType: string): Promise<string[]> {
    const defaultRecipients = Array.from(new Set([
      process.env.FOUNDER_EMAIL,
      process.env.ADMIN_EMAIL,
      process.env.OWNER_EMAIL,
      'autolearnspot@gmail.com',
      'femiadeleke2020@gmail.com'
    ].filter(Boolean))) as string[];

    try {
      const { data: config, error } = await supabaseAdmin
        .from('email_notifications')
        .select('recipient_emails, is_active')
        .eq('event_type', eventType)
        .eq('is_active', true)
        .maybeSingle();

      if (!error && config && config.is_active && Array.isArray(config.recipient_emails) && config.recipient_emails.length > 0) {
        return config.recipient_emails;
      }

      // Check site_settings fallback
      const { data: siteSetting } = await supabaseAdmin
        .from('site_settings')
        .select('value')
        .eq('key', 'email_notifications')
        .maybeSingle();

      if (siteSetting?.value) {
        try {
          const parsed = JSON.parse(siteSetting.value);
          if (parsed[eventType] && Array.isArray(parsed[eventType]) && parsed[eventType].length > 0) {
            return parsed[eventType];
          }
        } catch {
          // ignore parsing error
        }
      }

      return defaultRecipients;
    } catch (error) {
      console.error('[EmailService] Error fetching event recipients:', error);
      return defaultRecipients;
    }
  }

  /**
   * Send application submitted notification
   */
  static async sendApplicationSubmitted(
    email: string,
    name: string
  ): Promise<boolean> {
    const template: EmailTemplate = {
      to: email,
      subject: 'Application Submitted - AutoLearn Spot',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Application Submitted Successfully</h2>
          <p>Hi ${name},</p>
          <p>Thank you for your interest in becoming an author on AutoLearn Spot. Your application has been submitted successfully.</p>
          <p>Our team will review your application and get back to you within 3-5 business days.</p>
          <p>You can check the status of your application by logging into your account.</p>
          <p>Best regards,<br>The AutoLearn Spot Team</p>
        </div>
      `,
    };

    return this.sendEmail(template);
  }

  /**
   * Send application under review notification
   */
  static async sendApplicationUnderReview(
    email: string,
    name: string
  ): Promise<boolean> {
    const template: EmailTemplate = {
      to: email,
      subject: 'Application Under Review - AutoLearn Spot',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Application Under Review</h2>
          <p>Hi ${name},</p>
          <p>Your author application is now under review by our team.</p>
          <p>We are carefully evaluating your qualifications and will notify you of our decision soon.</p>
          <p>Best regards,<br>The AutoLearn Spot Team</p>
        </div>
      `,
    };

    return this.sendEmail(template);
  }

  /**
   * Send application approved notification
   */
  static async sendApplicationApproved(
    email: string,
    name: string,
    loginUrl?: string
  ): Promise<boolean> {
    // Use production URL if not provided
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autolearnspot.com';
    const authorLoginUrl = `${baseUrl}/author-sign-in`;
    const authorAuthUrl = `${baseUrl}/author-auth`;
    const signUpUrl = `${baseUrl}/sign-up?redirect=/author`;

    const template: EmailTemplate = {
      to: email,
      subject: 'Congratulations! Your Application is Approved - AutoLearn Spot',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #10B981;">Congratulations! 🎉</h2>
          <p>Dear ${name},</p>
          <p>We are pleased to inform you that your application to become an author on AutoLearn Spot has been <strong>approved</strong>!</p>

          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your Author Account Details</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Status:</strong> Active Author</p>
          </div>

          <p><strong>How to Access Your Author Dashboard:</strong></p>

          <p><strong>Scenario 1: You created an account during application</strong></p>
          <ol>
            <li>Visit the <a href="${authorLoginUrl}" style="color: #4F46E5;">Author Login Page</a></li>
            <li>Enter your email address (${email})</li>
            <li>Enter the password you created during sign-up</li>
            <li>You will be redirected to your author dashboard</li>
          </ol>

          <p><strong>Scenario 2: You haven't created an account yet</strong></p>
          <ol>
            <li>First, <a href="${signUpUrl}" style="color: #4F46E5;">Create Your Account</a></li>
            <li>Use your email address (${email})</li>
            <li>Create a secure password</li>
            <li>After sign-up, visit the <a href="${authorLoginUrl}" style="color: #4F46E5;">Author Login Page</a></li>
            <li>Log in with your new credentials</li>
          </ol>

          <p><strong>Quick Links:</strong></p>
          <p><a href="${authorLoginUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Log In to Author Portal</a></p>
          <p><a href="${signUpUrl}" style="background-color: #6B7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Create Account</a></p>
          <p><a href="${authorAuthUrl}" style="color: #4F46E5;">Author Portal Home</a></p>

          <p>You can now access the author dashboard and start creating your courses!</p>
          <p>If you have any questions or need assistance, please don't hesitate to reach out.</p>

          <p>Best regards,<br>The AutoLearn Spot Team</p>
        </div>
      `,
    };

    return this.sendEmail(template);
  }

  /**
   * Send application declined notification
   */
  static async sendApplicationDeclined(
    email: string,
    name: string,
    reason: string
  ): Promise<boolean> {
    const template: EmailTemplate = {
      to: email,
      subject: 'Application Update - AutoLearn Spot',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #EF4444;">Application Update</h2>
          <p>Hi ${name},</p>
          <p>After careful review, we regret to inform you that your application to become an author on AutoLearn Spot has been declined at this time.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p>We encourage you to continue developing your skills and reapply in the future when you feel you have gained more experience.</p>
          <p>Best regards,<br>The AutoLearn Spot Team</p>
        </div>
      `,
    };

    return this.sendEmail(template);
  }

  /**
   * Send author suspended notification
   */
  static async sendAuthorSuspended(
    email: string,
    name: string,
    reason: string
  ): Promise<boolean> {
    const template: EmailTemplate = {
      to: email,
      subject: 'Account Suspended - AutoLearn Spot',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #EF4444;">Account Suspended</h2>
          <p>Hi ${name},</p>
          <p>Your author account on AutoLearn Spot has been suspended.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p>If you believe this is an error or would like to appeal this decision, please contact our support team.</p>
          <p>Best regards,<br>The AutoLearn Spot Team</p>
        </div>
      `,
    };

    return this.sendEmail(template);
  }

  /**
   * Send author reactivated notification
   */
  static async sendAuthorReactivated(
    email: string,
    name: string
  ): Promise<boolean> {
    const template: EmailTemplate = {
      to: email,
      subject: 'Account Reactivated - AutoLearn Spot',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10B981;">Account Reactivated</h2>
          <p>Hi ${name},</p>
          <p>Good news! Your author account on AutoLearn Spot has been reactivated.</p>
          <p>You can now access the author portal and continue managing your courses.</p>
          <p>Best regards,<br>The AutoLearn Spot Team</p>
        </div>
      `,
    };

    return this.sendEmail(template);
  }

  /**
   * Send founder notification when someone applies
   */
  static async sendFounderNotification(
    applicantData: {
      fullName: string;
      email: string;
      phone: string;
      location: string;
      professionalTitle: string;
      yearsOfExperience: number;
      linkedinProfile?: string;
      websitePortfolio?: string;
      expertise: string[];
      bio: string;
    }
  ): Promise<boolean> {
    const recipients = await this.getEventRecipients('author_application_submitted');

    const expertiseList = applicantData.expertise
      .map(exp => `<li>${exp}</li>`)
      .join('');

    const template: EmailTemplateMultiple = {
      to: recipients,
      subject: `New Author Application: ${applicantData.fullName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">New Author Application Received</h2>
          <p>A new author application has been submitted on AutoLearn Spot.</p>

          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Applicant Details</h3>

            <p><strong>Name:</strong> ${applicantData.fullName}</p>
            <p><strong>Email:</strong> ${applicantData.email}</p>
            <p><strong>Phone:</strong> ${applicantData.phone}</p>
            <p><strong>Location:</strong> ${applicantData.location}</p>
            <p><strong>Professional Title:</strong> ${applicantData.professionalTitle}</p>
            <p><strong>Years of Experience:</strong> ${applicantData.yearsOfExperience}</p>

            ${applicantData.linkedinProfile ? `<p><strong>LinkedIn:</strong> <a href="${applicantData.linkedinProfile}">${applicantData.linkedinProfile}</a></p>` : ''}
            ${applicantData.websitePortfolio ? `<p><strong>Website/Portfolio:</strong> <a href="${applicantData.websitePortfolio}">${applicantData.websitePortfolio}</a></p>` : ''}

            <p><strong>Expertise Areas:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              ${expertiseList}
            </ul>

            <p><strong>Bio:</strong></p>
            <p style="font-style: italic; color: #6b7280;">${applicantData.bio}</p>
          </div>

          <p>Please review this application in the admin portal to approve or decline it.</p>
          <p>Best regards,<br>AutoLearn Spot System</p>
        </div>
      `,
    };

    return this.sendEmailMultiple(template);
  }

  /**
   * Send login verification code to affiliate partner
   */
  static async sendPartnerLoginCode(
    partnerEmail: string,
    partnerName: string,
    code: string
  ): Promise<boolean> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.autolearnspot.com';

    const template: EmailTemplate = {
      to: partnerEmail,
      subject: `Your Affiliate Portal Login Code: ${code} | AutoLearn Spot`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Affiliate Login Code</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 30px 15px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 24px; text-align: center;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">
                        Auto<span style="color: #10B981;">Learn</span> Spot
                      </h1>
                      <p style="margin: 6px 0 0; color: #94a3b8; font-size: 13px;">Affiliate Partner Portal</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 32px 28px;">
                      <h2 style="margin: 0 0 12px; font-size: 20px; color: #111827; font-weight: 700;">
                        Your Login Verification Code
                      </h2>
                      <p style="margin: 0 0 24px; font-size: 14px; color: #4b5563; line-height: 1.6;">
                        Hello ${partnerName || 'Partner'}, here is your one-time verification code to sign in to your AutoLearn Spot Affiliate Partner dashboard:
                      </p>

                      <div style="background-color: #f0fdf4; border: 2px dashed #86efac; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                        <span style="display: block; font-family: monospace; font-size: 36px; font-weight: 800; color: #065f46; letter-spacing: 8px;">
                          ${code}
                        </span>
                        <p style="margin: 8px 0 0; font-size: 12px; color: #047857; font-weight: 600;">
                          Valid for 10 minutes • Do not share this code with anyone
                        </p>
                      </div>

                      <p style="margin: 0 0 16px; font-size: 13px; color: #64748b; line-height: 1.6;">
                        If you did not request this login code, you can safely ignore this email. Your account remains secure.
                      </p>

                      <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.6;">
                        Best regards,<br>
                        <strong>The AutoLearn Spot Team</strong>
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; text-align: center; font-size: 12px; color: #94a3b8;">
                      © ${new Date().getFullYear()} AutoLearn Spot. All rights reserved.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
Hello ${partnerName || 'Partner'},

Your one-time login verification code for the AutoLearn Spot Affiliate Partner Portal is:

${code}

This code expires in 10 minutes. If you did not request this login code, you can safely ignore this email.

Best regards,
The AutoLearn Spot Team
${baseUrl}
      `.trim(),
    };

    return this.sendEmail(template);
  }

  /**
   * Send course purchase confirmation to student
   */
  static async sendCoursePurchaseConfirmation(
    studentEmail: string,
    studentName: string,
    courseTitle: string,
    amount: number,
    reference: string,
    customWhatsappUrl?: string
  ): Promise<boolean> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.autolearnspot.com';
    const studentDashboardUrl = `${baseUrl}/dashboard`;
    const whatsappCommunityUrl = customWhatsappUrl || process.env.WHATSAPP_GROUP_LINK || 'https://chat.whatsapp.com/JGZhpVPwZnr9WViOzkMFHy?s=cl&p=a&iam=2';

    const formattedAmount = typeof amount === 'number' ? `₦${amount.toLocaleString()}` : `₦${amount}`;

    const template: EmailTemplate = {
      to: studentEmail,
      subject: `🎉 Enrollment Confirmed: ${courseTitle} | AutoLearn Spot`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Course Purchase Confirmed</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 30px 15px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);">
                  
                  <!-- Header with Logo -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 30px; text-align: center;">
                      <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                        Auto<span style="color: #10B981;">Learn</span> Spot
                      </h1>
                      <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">Master Skills. Build Real Projects. Grow Your Future.</p>
                    </td>
                  </tr>

                  <!-- Main Content Area -->
                  <tr>
                    <td style="padding: 35px 30px;">
                      
                      <!-- Success Badge -->
                      <div style="text-align: center; margin-bottom: 24px;">
                        <span style="display: inline-block; background-color: #ecfdf5; color: #059669; font-size: 13px; font-weight: 700; padding: 6px 16px; border-radius: 50px; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #a7f3d0;">
                          Payment Confirmed • Immediate Access
                        </span>
                        <h2 style="margin: 16px 0 8px; font-size: 22px; color: #111827; font-weight: 700;">
                          Welcome to the Course, ${studentName}! 🎉
                        </h2>
                        <p style="margin: 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
                          Thank you for choosing AutoLearn Spot. Your enrollment has been verified and your course access is now fully active.
                        </p>
                      </div>

                      <!-- Order Summary Card -->
                      <table role="presentation" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 28px; padding: 20px;">
                        <tr>
                          <td>
                            <h3 style="margin: 0 0 14px; font-size: 15px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; font-weight: 700;">
                              Purchase Summary
                            </h3>
                            <table role="presentation" width="100%" style="font-size: 14px; line-height: 1.8;">
                              <tr>
                                <td style="color: #64748b; padding-bottom: 6px;">Course:</td>
                                <td style="color: #0f172a; font-weight: 700; text-align: right; padding-bottom: 6px;">${courseTitle}</td>
                              </tr>
                              <tr>
                                <td style="color: #64748b; padding-bottom: 6px;">Amount Paid:</td>
                                <td style="color: #059669; font-weight: 700; text-align: right; padding-bottom: 6px;">${formattedAmount}</td>
                              </tr>
                              <tr>
                                <td style="color: #64748b; padding-bottom: 6px;">Reference:</td>
                                <td style="color: #0f172a; font-family: monospace; font-size: 12px; text-align: right; padding-bottom: 6px;">${reference}</td>
                              </tr>
                              <tr>
                                <td style="color: #64748b;">Access Type:</td>
                                <td style="color: #0f172a; font-weight: 600; text-align: right;">Lifetime Course Access</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- Primary CTA: Go to Dashboard -->
                      <div style="text-align: center; margin-bottom: 30px;">
                        <a href="${studentDashboardUrl}" target="_blank" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);">
                          Go to Your Student Dashboard →
                        </a>
                        <p style="margin: 10px 0 0; font-size: 12px; color: #64748b;">
                          Direct link: <a href="${studentDashboardUrl}" style="color: #4f46e5; text-decoration: underline;">${studentDashboardUrl}</a>
                        </p>
                      </div>

                      <!-- WhatsApp Community Box -->
                      <table role="presentation" width="100%" style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 1.5px solid #86efac; border-radius: 14px; margin-bottom: 30px; padding: 22px;">
                        <tr>
                          <td>
                            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                              <span style="font-size: 24px; margin-right: 10px;">💬</span>
                              <h3 style="margin: 0; font-size: 17px; color: #065f46; font-weight: 700;">
                                Join the Student WhatsApp Community
                              </h3>
                            </div>
                            <p style="margin: 0 0 16px; font-size: 14px; color: #047857; line-height: 1.6;">
                              Connect with fellow learners, get live class announcements, ask questions, interact with your instructor, and stay updated with the cohort.
                            </p>
                            <div style="text-align: center;">
                              <a href="${whatsappCommunityUrl}" target="_blank" style="display: inline-block; background-color: #25D366; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 8px; box-shadow: 0 3px 10px rgba(37, 211, 102, 0.3);">
                                Join WhatsApp Group Now
                              </a>
                              <p style="margin: 10px 0 0; font-size: 12px; color: #047857;">
                                Group Link: <a href="${whatsappCommunityUrl}" style="color: #047857; text-decoration: underline; word-break: break-all;">${whatsappCommunityUrl}</a>
                              </p>
                            </div>
                          </td>
                        </tr>
                      </table>

                      <!-- Next Steps Section -->
                      <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-bottom: 24px;">
                        <h4 style="margin: 0 0 14px; font-size: 15px; color: #111827; font-weight: 700;">
                          What to do next:
                        </h4>
                        <ol style="margin: 0; padding-left: 20px; font-size: 14px; color: #4b5563; line-height: 1.8;">
                          <li><strong>Open Your Dashboard:</strong> Log in with <strong>${studentEmail}</strong> to watch your video lessons and download course resources.</li>
                          <li><strong>Join the WhatsApp Community:</strong> Stay connected with instructors and fellow students for discussions and updates.</li>
                          <li><strong>Complete Lessons & Quizzes:</strong> Follow through all sections at your own pace to earn your certificate of completion.</li>
                        </ol>
                      </div>

                      <!-- Support Section -->
                      <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.6;">
                        Need help or have questions? Simply reply directly to this email or reach us at <a href="mailto:support@autolearnspot.com" style="color: #4f46e5; text-decoration: underline;">support@autolearnspot.com</a>.
                      </p>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 30px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.6;">
                      <p style="margin: 0 0 6px;">© ${new Date().getFullYear()} AutoLearn Spot. All rights reserved.</p>
                      <p style="margin: 0;">
                        <a href="${baseUrl}" style="color: #64748b; text-decoration: none; margin: 0 8px;">Website</a> • 
                        <a href="${studentDashboardUrl}" style="color: #64748b; text-decoration: none; margin: 0 8px;">Dashboard</a> • 
                        <a href="${baseUrl}/terms" style="color: #64748b; text-decoration: none; margin: 0 8px;">Terms</a> • 
                        <a href="${baseUrl}/contact" style="color: #64748b; text-decoration: none; margin: 0 8px;">Contact Support</a>
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
🎉 Course Purchase Confirmed!

Dear ${studentName},

Thank you for your purchase on AutoLearn Spot! Your payment has been successfully processed and your course access is now active.

PURCHASE DETAILS:
- Course: ${courseTitle}
- Amount Paid: ${formattedAmount}
- Transaction Reference: ${reference}
- Access: Lifetime Course Access

NEXT STEPS:
1. ACCESS YOUR STUDENT DASHBOARD:
Go to: ${studentDashboardUrl}
(Log in with ${studentEmail} to begin watching your lessons and access materials)

2. JOIN THE STUDENTS WHATSAPP COMMUNITY:
Join here: ${whatsappCommunityUrl}
Connect with fellow learners, get live class updates, and ask questions.

3. EARN YOUR CERTIFICATE:
Complete your coursework and quizzes to earn your verified certificate.

If you have any questions, reach out to support@autolearnspot.com.

Best regards,
The AutoLearn Spot Team
${baseUrl}
      `.trim(),
    };

    return this.sendEmail(template);
  }

  /**
   * Send course purchase notification to configured recipients
   */
  static async sendCoursePurchaseNotificationToRecipients(
    studentEmail: string,
    studentName: string,
    courseTitle: string,
    amount: number,
    reference: string
  ): Promise<boolean> {
    const recipients = await this.getEventRecipients('course_purchase');

    const template: EmailTemplateMultiple = {
      to: recipients,
      subject: `New Course Purchase: ${courseTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4F46E5;">New Course Purchase</h2>
          <p>A new course has been purchased on AutoLearn Spot.</p>

          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Purchase Details</h3>
            <p><strong>Course:</strong> ${courseTitle}</p>
            <p><strong>Student:</strong> ${studentName}</p>
            <p><strong>Student Email:</strong> ${studentEmail}</p>
            <p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
            <p><strong>Reference:</strong> ${reference}</p>
          </div>

          <p>Best regards,<br>AutoLearn Spot System</p>
        </div>
      `,
    };

    return this.sendEmailMultiple(template);
  }

  /**
   * Send confirmation email to admin and founders when a manual enrollment is completed
   */
  static async sendManualEnrollmentAdminConfirmation({
    adminEmail,
    studentName,
    studentEmail,
    courseTitle,
    orderRef,
    enrolledAt,
    reason,
  }: {
    adminEmail?: string;
    studentName: string;
    studentEmail: string;
    courseTitle: string;
    orderRef: string;
    enrolledAt?: string;
    reason?: string;
  }): Promise<boolean> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.autolearnspot.com';
    const studentsAdminUrl = `${baseUrl}/admin/students`;

    const recipients = Array.from(new Set([
      adminEmail,
      process.env.ADMIN_EMAIL,
      process.env.FOUNDER_EMAIL,
      process.env.OWNER_EMAIL,
      'autolearnspot@gmail.com',
      'femiadeleke2020@gmail.com'
    ].filter(Boolean))) as string[];

    const formattedDate = enrolledAt 
      ? new Date(enrolledAt).toLocaleString('en-US', { timeZone: 'Africa/Lagos', dateStyle: 'full', timeStyle: 'short' })
      : new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos', dateStyle: 'full', timeStyle: 'short' });

    const template: EmailTemplateMultiple = {
      to: recipients,
      subject: `✅ Manual Enrollment Confirmed: ${studentName} enrolled in ${courseTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Manual Enrollment Confirmed</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 30px 15px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);">
                  
                  <!-- Header with Logo -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 30px; text-align: center;">
                      <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                        Auto<span style="color: #10B981;">Learn</span> Spot
                      </h1>
                      <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">Administrator Notification • Manual Enrollment</p>
                    </td>
                  </tr>

                  <!-- Main Content Area -->
                  <tr>
                    <td style="padding: 35px 30px;">
                      
                      <!-- Success Badge -->
                      <div style="text-align: center; margin-bottom: 24px;">
                        <span style="display: inline-block; background-color: #ecfdf5; color: #059669; font-size: 13px; font-weight: 700; padding: 6px 16px; border-radius: 50px; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #a7f3d0;">
                          Manual Enrollment Successful
                        </span>
                        <h2 style="margin: 16px 0 8px; font-size: 22px; color: #111827; font-weight: 700;">
                          Student Enrolled Successfully
                        </h2>
                        <p style="margin: 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
                          You have successfully granted manual course access to <strong>${studentName}</strong>. A welcome email with course access instructions has been dispatched to their inbox.
                        </p>
                      </div>

                      <!-- Details Card -->
                      <table role="presentation" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 28px; padding: 20px;">
                        <tr>
                          <td>
                            <h3 style="margin: 0 0 14px; font-size: 14px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; font-weight: 700;">
                              Enrollment Details
                            </h3>
                            <table role="presentation" width="100%" style="font-size: 14px; line-height: 1.8;">
                              <tr>
                                <td style="color: #64748b; padding-bottom: 6px;">Student:</td>
                                <td style="color: #0f172a; font-weight: 700; text-align: right; padding-bottom: 6px;">${studentName}</td>
                              </tr>
                              <tr>
                                <td style="color: #64748b; padding-bottom: 6px;">Email:</td>
                                <td style="color: #0f172a; font-weight: 600; text-align: right; padding-bottom: 6px;">${studentEmail}</td>
                              </tr>
                              <tr>
                                <td style="color: #64748b; padding-bottom: 6px;">Course:</td>
                                <td style="color: #0f172a; font-weight: 700; text-align: right; padding-bottom: 6px;">${courseTitle}</td>
                              </tr>
                              <tr>
                                <td style="color: #64748b; padding-bottom: 6px;">Reference:</td>
                                <td style="color: #0f172a; font-family: monospace; font-size: 12px; text-align: right; padding-bottom: 6px;">${orderRef}</td>
                              </tr>
                              <tr>
                                <td style="color: #64748b; padding-bottom: 6px;">Enrolled By:</td>
                                <td style="color: #0f172a; text-align: right; padding-bottom: 6px;">${adminEmail || 'Administrator'}</td>
                              </tr>
                              <tr>
                                <td style="color: #64748b; padding-bottom: 6px;">Date & Time:</td>
                                <td style="color: #0f172a; text-align: right; padding-bottom: 6px;">${formattedDate}</td>
                              </tr>
                              ${reason ? `
                              <tr>
                                <td style="color: #64748b; padding-bottom: 6px;">Reason / Notes:</td>
                                <td style="color: #0f172a; text-align: right; padding-bottom: 6px;">${reason}</td>
                              </tr>` : ''}
                              <tr>
                                <td style="color: #64748b;">Access Status:</td>
                                <td style="color: #059669; font-weight: 700; text-align: right;">Active (Full Lifetime Access)</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- Action CTA -->
                      <div style="text-align: center; margin-bottom: 24px;">
                        <a href="${studentsAdminUrl}" target="_blank" style="display: inline-block; background-color: #10B981; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                          View Students List →
                        </a>
                      </div>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 30px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.6;">
                      <p style="margin: 0;">© ${new Date().getFullYear()} AutoLearn Spot. Internal Administrative System.</p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
Manual Enrollment Confirmed!

Student: ${studentName} (${studentEmail})
Course: ${courseTitle}
Reference: ${orderRef}
Enrolled By: ${adminEmail || 'Administrator'}
Date: ${formattedDate}
${reason ? `Reason / Notes: ${reason}\n` : ''}Status: Active (Full Lifetime Access)

Manage students at: ${studentsAdminUrl}

AutoLearn Spot Administration
      `.trim(),
    };

    return this.sendEmailMultiple(template);
  }

  /**
   * Send course sale notification to author
   */
    /**
   * Alias for sendCourseSaleNotification
   */
  static async sendAuthorNewSaleNotification(
    authorEmail: string,
    authorName: string,
    courseTitle: string,
    amount: number,
    authorEarnings: number,
    studentName?: string,
    orderId?: string
  ): Promise<boolean> {
    return this.sendCourseSaleNotification(
      authorEmail,
      authorName,
      courseTitle,
      studentName || 'Student',
      amount,
      authorEarnings
    );
  }

  static async sendCourseSaleNotification(
    authorEmail: string,
    authorName: string,
    courseTitle: string,
    studentEmail: string,
    amount: number,
    authorEarnings: number
  ): Promise<boolean> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.autolearnspot.com';
    const earningsUrl = `${baseUrl}/author/earnings`;

    const template: EmailTemplate = {
      to: authorEmail,
      subject: `New Course Sale: ${courseTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #10B981;">💰 New Course Sale!</h2>
          <p>Dear ${authorName},</p>
          <p>Great news! Someone just purchased your course.</p>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Sale Details</h3>
            <p><strong>Course:</strong> ${courseTitle}</p>
            <p><strong>Student Email:</strong> ${studentEmail}</p>
            <p><strong>Sale Amount:</strong> ₦${amount.toLocaleString()}</p>
            <p><strong>Your Earnings:</strong> ₦${authorEarnings.toLocaleString()}</p>
          </div>
          
          <p>Your earnings have been added to your available balance. You can request a withdrawal from your author dashboard.</p>
          <p><a href="${earningsUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Your Earnings</a></p>
          
          <p>Keep up the great work!</p>
          <p>Best regards,<br>The AutoLearn Spot Team</p>
        </div>
      `,
    };

    return this.sendEmail(template);
  }

  /**
   * Send course sale notification to founder
   */
  static async sendFounderCourseSaleNotification(
    courseTitle: string,
    authorName: string,
    studentEmail: string,
    amount: number,
    platformCommission: number
  ): Promise<boolean> {
    const recipients = await this.getEventRecipients('course_sale');

    const template: EmailTemplateMultiple = {
      to: recipients,
      subject: `New Course Sale: ${courseTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4F46E5;">New Course Sale on AutoLearn Spot</h2>
          <p>A new course has been purchased on the platform.</p>

          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Sale Details</h3>
            <p><strong>Course:</strong> ${courseTitle}</p>
            <p><strong>Author:</strong> ${authorName}</p>
            <p><strong>Student Email:</strong> ${studentEmail}</p>
            <p><strong>Sale Amount:</strong> ₦${amount.toLocaleString()}</p>
            <p><strong>Platform Commission:</strong> ₦${platformCommission.toLocaleString()}</p>
          </div>

          <p>Best regards,<br>AutoLearn Spot System</p>
        </div>
      `,
    };

    return this.sendEmailMultiple(template);
  }

  /**
   * Send withdrawal request notification to founder
   */
  static async sendFounderWithdrawalNotification(
    authorName: string,
    authorEmail: string,
    amount: number,
    reference: string
  ): Promise<boolean> {
    const recipients = await this.getEventRecipients('withdrawal_request');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.autolearnspot.com';
    const adminUrl = `${baseUrl}/admin/withdrawals`;

    const template: EmailTemplateMultiple = {
      to: recipients,
      subject: `New Withdrawal Request: ₦${amount.toLocaleString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4F46E5;">New Withdrawal Request</h2>
          <p>An author has requested a withdrawal from their earnings.</p>

          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Withdrawal Details</h3>
            <p><strong>Author:</strong> ${authorName}</p>
            <p><strong>Author Email:</strong> ${authorEmail}</p>
            <p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
            <p><strong>Reference:</strong> ${reference}</p>
          </div>

          <p>Please review and approve this withdrawal request in the admin portal.</p>
          <p><a href="${adminUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Review Withdrawals</a></p>

          <p>Best regards,<br>AutoLearn Spot System</p>
        </div>
      `,
    };

    return this.sendEmailMultiple(template);
  }

  /**
   * Send withdrawal payment notification to author
   */
  static async sendWithdrawalPaidNotification(
    authorEmail: string,
    authorName: string,
    amount: number,
    reference: string
  ): Promise<boolean> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.autolearnspot.com';
    const earningsUrl = `${baseUrl}/author/earnings`;

    const template: EmailTemplate = {
      to: authorEmail,
      subject: `Withdrawal Payment Sent: ₦${amount.toLocaleString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #10B981;">💰 Withdrawal Payment Sent!</h2>
          <p>Dear ${authorName},</p>
          <p>Great news! Your withdrawal request has been processed and the payment has been sent to your bank account.</p>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Payment Details</h3>
            <p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
            <p><strong>Reference:</strong> ${reference}</p>
            <p><strong>Status:</strong> Paid</p>
          </div>
          
          <p>The funds should appear in your bank account within 24-48 hours, depending on your bank's processing time.</p>
          <p>Please check your bank account and confirm receipt of the payment.</p>
          <p><a href="${earningsUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Your Earnings</a></p>
          
          <p>If you don't receive the payment within 48 hours, please contact our support team.</p>
          <p>Thank you for being part of AutoLearn Spot!</p>
          <p>Best regards,<br>The AutoLearn Spot Team</p>
        </div>
      `,
    };

    return this.sendEmail(template);
  }

  /**
   * Send withdrawal rejection notification to author
   */
  static async sendWithdrawalRejectedNotification(
    authorEmail: string,
    authorName: string,
    amount: number,
    reference: string,
    reason?: string
  ): Promise<boolean> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.autolearnspot.com';
    const earningsUrl = `${baseUrl}/author/earnings`;

    const template: EmailTemplate = {
      to: authorEmail,
      subject: `Withdrawal Request Rejected: ₦${amount.toLocaleString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #EF4444;">Withdrawal Request Rejected</h2>
          <p>Dear ${authorName},</p>
          <p>We regret to inform you that your withdrawal request has been rejected.</p>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Withdrawal Details</h3>
            <p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
            <p><strong>Reference:</strong> ${reference}</p>
            <p><strong>Status:</strong> Rejected</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          </div>
          
          <p>The amount has been returned to your available balance. You can submit a new withdrawal request from your author dashboard.</p>
          <p><a href="${earningsUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Your Earnings</a></p>
          
          <p>If you have any questions or believe this is an error, please contact our support team.</p>
          <p>Best regards,<br>The AutoLearn Spot Team</p>
        </div>
      `,
    };

    return this.sendEmail(template);
  }

  /**
   * Send author suspension notification to configured recipients
   */
  static async sendAuthorSuspensionNotification(
    authorName: string,
    authorEmail: string,
    reason: string
  ): Promise<boolean> {
    const recipients = await this.getEventRecipients('author_suspended');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.autolearnspot.com';
    const adminUrl = `${baseUrl}/admin/authors`;

    const template: EmailTemplateMultiple = {
      to: recipients,
      subject: `Author Suspended: ${authorName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #EF4444;">Author Suspended</h2>
          <p>An author has been suspended on AutoLearn Spot.</p>

          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Suspension Details</h3>
            <p><strong>Author:</strong> ${authorName}</p>
            <p><strong>Author Email:</strong> ${authorEmail}</p>
            <p><strong>Reason:</strong> ${reason}</p>
          </div>

          <p>Please review this suspension in the admin portal.</p>
          <p><a href="${adminUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Manage Authors</a></p>

          <p>Best regards,<br>AutoLearn Spot System</p>
        </div>
      `,
    };

    return this.sendEmailMultiple(template);
  }

  /**
   * Send author reactivation notification to configured recipients
   */
  static async sendAuthorReactivationNotification(
    authorName: string,
    authorEmail: string
  ): Promise<boolean> {
    const recipients = await this.getEventRecipients('author_reactivated');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.autolearnspot.com';
    const adminUrl = `${baseUrl}/admin/authors`;

    const template: EmailTemplateMultiple = {
      to: recipients,
      subject: `Author Reactivated: ${authorName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #10B981;">Author Reactivated</h2>
          <p>An author has been reactivated on AutoLearn Spot.</p>

          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Reactivation Details</h3>
            <p><strong>Author:</strong> ${authorName}</p>
            <p><strong>Author Email:</strong> ${authorEmail}</p>
            <p><strong>Status:</strong> Active</p>
          </div>

          <p>The author can now access the author portal and continue managing their courses.</p>
          <p><a href="${adminUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Manage Authors</a></p>

          <p>Best regards,<br>AutoLearn Spot System</p>
        </div>
      `,
    };

    return this.sendEmailMultiple(template);
  }

  /**
   * Send founder notification when a product is submitted for review
   */
  static async sendFounderProductSubmissionNotification(
    productData: {
      title: string;
      authorName: string;
      authorEmail: string;
      productType: string;
      price: number;
      currency: string;
      description?: string;
    }
  ): Promise<boolean> {
    const recipients = await this.getEventRecipients('product_submitted');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.autolearnspot.com';
    const adminUrl = `${baseUrl}/admin/products`;

    // Parse description if it's JSON
    let shortDescription = '';
    if (productData.description) {
      try {
        const descObj = JSON.parse(productData.description);
        shortDescription = descObj.short_description || descObj.full_description || '';
      } catch (e) {
        shortDescription = productData.description;
      }
    }

    const template: EmailTemplateMultiple = {
      to: recipients,
      subject: `New Product Submitted for Review: ${productData.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4F46E5;">New Product Submitted for Review</h2>
          <p>A new learning product has been submitted for review on AutoLearn Spot.</p>

          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Product Details</h3>
            <p><strong>Product Title:</strong> ${productData.title}</p>
            <p><strong>Product Type:</strong> ${productData.productType}</p>
            <p><strong>Price:</strong> ${productData.currency} ${productData.price.toLocaleString()}</p>
            <p><strong>Author:</strong> ${productData.authorName}</p>
            <p><strong>Author Email:</strong> ${productData.authorEmail}</p>
            ${shortDescription ? `<p><strong>Description:</strong> ${shortDescription.substring(0, 200)}${shortDescription.length > 200 ? '...' : ''}</p>` : ''}
          </div>

          <p>Please review this product in the admin portal to approve or decline it for publication.</p>
          <p><a href="${adminUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Review Products</a></p>

          <p>Best regards,<br>AutoLearn Spot System</p>
        </div>
      `,
    };

    return this.sendEmailMultiple(template);
  }

  /**
   * Send product published notification to author
   */
  static async sendProductPublishedNotification(
    authorName: string,
    authorEmail: string,
    productTitle: string,
    productId: string
  ): Promise<boolean> {
    const recipients = await this.getEventRecipients('product_published');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.autolearnspot.com';
    const productUrl = `${baseUrl}/learning_products/${productId}`;

    const template: EmailTemplateMultiple = {
      to: recipients,
      subject: `🎉 Your Product Has Been Published: ${productTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #10B981;">Congratulations! Your Product is Now Live</h2>
          <p>Dear ${authorName},</p>
          <p>Great news! Your product has been reviewed and published on AutoLearn Spot.</p>

          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Product Details</h3>
            <p><strong>Product Title:</strong> ${productTitle}</p>
            <p><strong>Status:</strong> Published</p>
          </div>

          <p>Your product is now available for students to discover and purchase. You can view it on the platform.</p>
          <p><a href="${productUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Your Product</a></p>

          <p>Best regards,<br>The AutoLearn Spot Team</p>
        </div>
      `,
    };

    return this.sendEmailMultiple(template);
  }

  /**
   * Send product rejected notification to author
   */
  static async sendProductRejectedNotification(
    authorName: string,
    authorEmail: string,
    productTitle: string,
    feedback: string
  ): Promise<boolean> {
    const recipients = await this.getEventRecipients('product_rejected');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.autolearnspot.com';
    const authorUrl = `${baseUrl}/author/products`;

    const template: EmailTemplateMultiple = {
      to: recipients,
      subject: `Product Review Update: ${productTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #EF4444;">Product Review Update</h2>
          <p>Dear ${authorName},</p>
          <p>We have reviewed your product submission, and unfortunately, it has been declined at this time.</p>

          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Product Details</h3>
            <p><strong>Product Title:</strong> ${productTitle}</p>
            <p><strong>Status:</strong> Rejected</p>
            <p><strong>Feedback:</strong> ${feedback}</p>
          </div>

          <p>We encourage you to review the feedback and make the necessary improvements before resubmitting your product.</p>
          <p><a href="${authorUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Your Products</a></p>

          <p>If you have any questions or need clarification on the feedback, please don't hesitate to reach out.</p>
          <p>Best regards,<br>The AutoLearn Spot Team</p>
        </div>
      `,
    };

    return this.sendEmailMultiple(template);
  }

  /**
   * Send course completion notification
   */
  static async sendCourseCompletionNotification(
    studentEmail: string,
    studentName: string,
    courseTitle: string,
    authorEmail: string,
    authorName: string
  ): Promise<boolean> {
    const recipients = await this.getEventRecipients('course_completion');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.autolearnspot.com';

    const template: EmailTemplateMultiple = {
      to: recipients,
      subject: `Course Completed: ${courseTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #10B981;">🎉 Course Completed!</h2>
          <p>A student has successfully completed a course on AutoLearn Spot.</p>

          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Completion Details</h3>
            <p><strong>Course:</strong> ${courseTitle}</p>
            <p><strong>Student:</strong> ${studentName}</p>
            <p><strong>Student Email:</strong> ${studentEmail}</p>
            <p><strong>Author:</strong> ${authorName}</p>
          </div>

          <p>Best regards,<br>AutoLearn Spot System</p>
        </div>
      `,
    };

    return this.sendEmailMultiple(template);
  }

  /**
   * Send quiz completion notification
   */
  static async sendQuizCompletionNotification(
    studentEmail: string,
    studentName: string,
    quizTitle: string,
    score: number,
    passingScore: number
  ): Promise<boolean> {
    const recipients = await this.getEventRecipients('quiz_completion');

    const template: EmailTemplateMultiple = {
      to: recipients,
      subject: `Quiz Completed: ${quizTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4F46E5;">Quiz Completed</h2>
          <p>A student has completed a quiz on AutoLearn Spot.</p>

          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Quiz Details</h3>
            <p><strong>Quiz:</strong> ${quizTitle}</p>
            <p><strong>Student:</strong> ${studentName}</p>
            <p><strong>Student Email:</strong> ${studentEmail}</p>
            <p><strong>Score:</strong> ${score}%</p>
            <p><strong>Passing Score:</strong> ${passingScore}%</p>
            <p><strong>Status:</strong> ${score >= passingScore ? 'Passed ✅' : 'Failed ❌'}</p>
          </div>

          <p>Best regards,<br>AutoLearn Spot System</p>
        </div>
      `,
    };

    return this.sendEmailMultiple(template);
  }

  /**
   * Send assignment submission notification
   */
  static async sendAssignmentSubmissionNotification(
    studentEmail: string,
    studentName: string,
    assignmentTitle: string,
    authorEmail: string,
    authorName: string
  ): Promise<boolean> {
    const recipients = await this.getEventRecipients('assignment_submission');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.autolearnspot.com';

    const template: EmailTemplateMultiple = {
      to: recipients,
      subject: `Assignment Submitted: ${assignmentTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4F46E5;">Assignment Submitted</h2>
          <p>A student has submitted an assignment on AutoLearn Spot.</p>

          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Submission Details</h3>
            <p><strong>Assignment:</strong> ${assignmentTitle}</p>
            <p><strong>Student:</strong> ${studentName}</p>
            <p><strong>Student Email:</strong> ${studentEmail}</p>
            <p><strong>Author:</strong> ${authorName}</p>
          </div>

          <p>Please review the submission in your author dashboard.</p>
          <p>Best regards,<br>AutoLearn Spot System</p>
        </div>
      `,
    };

    return this.sendEmailMultiple(template);
  }

  /**
   * Send new student enrollment notification
   */
  static async sendNewStudentEnrollmentNotification(
    studentEmail: string,
    studentName: string,
    courseTitle: string
  ): Promise<boolean> {
    const recipients = await this.getEventRecipients('new_student_enrollment');

    const template: EmailTemplateMultiple = {
      to: recipients,
      subject: `New Student Enrollment: ${courseTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #10B981;">New Student Enrollment</h2>
          <p>A new student has enrolled in a course on AutoLearn Spot.</p>

          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Enrollment Details</h3>
            <p><strong>Course:</strong> ${courseTitle}</p>
            <p><strong>Student:</strong> ${studentName}</p>
            <p><strong>Student Email:</strong> ${studentEmail}</p>
          </div>

          <p>Best regards,<br>AutoLearn Spot System</p>
        </div>
      `,
    };

    return this.sendEmailMultiple(template);
  }

  /**
   * Send system alert notification
   */
  static async sendSystemAlertNotification(
    alertType: string,
    message: string,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<boolean> {
    const recipients = await this.getEventRecipients('system_alert');

    const severityColors = {
      low: '#10B981',
      medium: '#F59E0B',
      high: '#EF4444',
      critical: '#DC2626'
    };

    const template: EmailTemplateMultiple = {
      to: recipients,
      subject: `🚨 System Alert: ${alertType}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: ${severityColors[severity]};">System Alert</h2>
          <p>A system alert has been triggered on AutoLearn Spot.</p>

          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Alert Details</h3>
            <p><strong>Type:</strong> ${alertType}</p>
            <p><strong>Severity:</strong> ${severity.toUpperCase()}</p>
            <p><strong>Message:</strong> ${message}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <p>Please investigate this alert as soon as possible.</p>
          <p>Best regards,<br>AutoLearn Spot System</p>
        </div>
      `,
    };

    return this.sendEmailMultiple(template);
  }

  /**
   * Send new direct message notification email
   */
  static async sendNewDirectMessageEmail(
    toEmail: string,
    recipientName: string,
    senderName: string,
    messagePreview: string,
    actionUrl: string
  ): Promise<boolean> {
    const template: EmailTemplate = {
      to: toEmail,
      subject: `New message from ${senderName} on AutoLearn Spot`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0284c7;">💬 New Message Received</h2>
          <p>Hi ${recipientName},</p>
          <p><strong>${senderName}</strong> sent you a message:</p>

          <div style="background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 16px 20px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: #334155; font-size: 15px; white-space: pre-wrap;">${messagePreview}</p>
          </div>

          <p style="margin-top: 25px;">
            <a href="${actionUrl}" style="background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">Open & Reply to Message</a>
          </p>

          <p style="color: #64748b; font-size: 13px; margin-top: 25px;">
            Please reply directly on AutoLearn Spot to keep your communication safe and organized.
          </p>
          <p style="color: #64748b; font-size: 13px;">
            Best regards,<br>The AutoLearn Spot Team
          </p>
        </div>
      `,
    };

    return this.sendEmail(template);
  }
}
