/**
 * Email Notification Service
 * 
 * This service handles sending emails for author application status changes
 * and other author-related notifications using Nodemailer.
 * 
 * Uses the same SMTP configuration as existing services (partners, scholarship, etc.)
 */

import nodemailer from 'nodemailer';

interface EmailTemplate {
  to: string;
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

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export class EmailService {

  /**
   * Send an email - using the same pattern as existing services
   */
  private static async sendEmail(template: EmailTemplate): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@autolearnspot.com',
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
    const founderEmail = process.env.FOUNDER_EMAIL || 'femiadeleke2020@gmail.com';
    
    const expertiseList = applicantData.expertise
      .map(exp => `<li>${exp}</li>`)
      .join('');

    const template: EmailTemplate = {
      to: founderEmail,
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

    return this.sendEmail(template);
  }
}
