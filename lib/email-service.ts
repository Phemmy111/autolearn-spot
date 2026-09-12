/**
 * Email Notification Service
 * 
 * This service handles sending emails for author application status changes
 * and other author-related notifications using Nodemailer.
 */

import nodemailer from 'nodemailer';

interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  /**
   * Initialize email transporter
   */
  private static getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      // Check which email provider to use
      const emailProvider = process.env.EMAIL_PROVIDER || 'smtp';
      
      if (emailProvider === 'resend') {
        // Resend API integration
        this.transporter = nodemailer.createTransport({
          host: 'smtp.resend.com',
          port: 587,
          secure: false,
          auth: {
            user: 'resend',
            pass: process.env.RESEND_API_KEY,
          },
        });
      } else if (emailProvider === 'sendgrid') {
        // SendGrid integration
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY,
          },
        });
      } else {
        // Default SMTP configuration (works with Gmail, Outlook, custom SMTP)
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        });
      }
    }
    
    return this.transporter;
  }

  /**
   * Send an email
   */
  private static async sendEmail(template: EmailTemplate): Promise<boolean> {
    try {
      const transporter = this.getTransporter();
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'AutoLearn Spot <noreply@autolearnspot.com>',
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
        html: template.html,
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
    const template: EmailTemplate = {
      to: email,
      subject: 'Congratulations! Your Application is Approved - AutoLearn Spot',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10B981;">Congratulations! Your Application is Approved</h2>
          <p>Hi ${name},</p>
          <p>We are pleased to inform you that your application to become an author on AutoLearn Spot has been approved!</p>
          <p>You can now access the author portal and start creating your courses.</p>
          ${loginUrl ? `<p><a href="${loginUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Access Author Portal</a></p>` : ''}
          <p>If you have any questions, please don't hesitate to reach out.</p>
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
}
