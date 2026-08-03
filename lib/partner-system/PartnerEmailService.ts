import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export class PartnerEmailService {
  /**
   * Send application received email
   */
  static async sendApplicationReceivedEmail(partnerId: string): Promise<boolean> {
    try {
      const { data: application, error } = await supabase
        .from('partner_applications')
        .select('full_name, email')
        .eq('id', partnerId)
        .single();

      if (error || !application) {
        console.error('Application not found:', error);
        return false;
      }

      // Send email using existing email service
      const { EmailService } = await import('@/lib/email/EmailService');
      
      await EmailService.sendEmail({
        to: application.email,
        subject: 'Application Received - AutoLearn Spot Partner Program',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00F5FF;">Application Received</h2>
            <p>Dear ${application.full_name},</p>
            <p>Thank you for applying to become a Community Partner with AutoLearn Spot. We have received your application and our team will review it within 2-3 business days.</p>
            <p>You will receive an email notification once your application has been reviewed.</p>
            <p>Best regards,<br>AutoLearn Spot Team</p>
          </div>
        `
      });

      return true;
    } catch (error) {
      console.error('Error sending application received email:', error);
      return false;
    }
  }

  /**
   * Send application approved email
   */
  static async sendApplicationApprovedEmail(partnerId: string): Promise<boolean> {
    try {
      const { data: partner, error } = await supabase
        .from('partners')
        .select('full_name, email, partner_id')
        .eq('id', partnerId)
        .single();

      if (error || !partner) {
        console.error('Partner not found:', error);
        return false;
      }

      const { EmailService } = await import('@/lib/email/EmailService');
      
      await EmailService.sendEmail({
        to: partner.email,
        subject: 'Application Approved - Welcome to AutoLearn Spot Partner Program',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00F5FF;">Application Approved!</h2>
            <p>Dear ${partner.full_name},</p>
            <p>Congratulations! Your application to become a Community Partner with AutoLearn Spot has been approved.</p>
            <p>Your Partner ID: <strong>${partner.partner_id}</strong></p>
            <p>You can now access your partner dashboard to:</p>
            <ul>
              <li>Get your unique referral link</li>
              <li>Track your referrals and earnings</li>
              <li>Download marketing materials</li>
              <li>Request withdrawals</li>
            </ul>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/partners/dashboard" style="color: #00F5FF;">Access Your Dashboard</a></p>
            <p>Best regards,<br>AutoLearn Spot Team</p>
          </div>
        `
      });

      return true;
    } catch (error) {
      console.error('Error sending application approved email:', error);
      return false;
    }
  }

  /**
   * Send application rejected email
   */
  static async sendApplicationRejectedEmail(applicationId: string, reason: string): Promise<boolean> {
    try {
      const { data: application, error } = await supabase
        .from('partner_applications')
        .select('full_name, email')
        .eq('id', applicationId)
        .single();

      if (error || !application) {
        console.error('Application not found:', error);
        return false;
      }

      const { EmailService } = await import('@/lib/email/EmailService');
      
      await EmailService.sendEmail({
        to: application.email,
        subject: 'Application Status Update - AutoLearn Spot Partner Program',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FF6B6B;">Application Update</h2>
            <p>Dear ${application.full_name},</p>
            <p>Thank you for your interest in becoming a Community Partner with AutoLearn Spot.</p>
            <p>After careful review, we regret to inform you that your application has been declined at this time.</p>
            ${reason ? `<p>Reason: ${reason}</p>` : ''}
            <p>We encourage you to continue developing your skills and consider applying again in the future.</p>
            <p>Best regards,<br>AutoLearn Spot Team</p>
          </div>
        `
      });

      return true;
    } catch (error) {
      console.error('Error sending application rejected email:', error);
      return false;
    }
  }

  /**
   * Send commission earned email
   */
  static async sendCommissionEarnedEmail(partnerId: string, amount: number, referralCode: string): Promise<boolean> {
    try {
      const { data: partner, error } = await supabase
        .from('partners')
        .select('full_name, email')
        .eq('id', partnerId)
        .single();

      if (error || !partner) {
        console.error('Partner not found:', error);
        return false;
      }

      const { EmailService } = await import('@/lib/email/EmailService');
      
      await EmailService.sendEmail({
        to: partner.email,
        subject: `Commission Earned - ₦${amount}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00F5FF;">Commission Earned!</h2>
            <p>Dear ${partner.full_name},</p>
            <p>Great news! You've earned a commission of <strong>₦${amount}</strong> from a new student enrollment.</p>
            <p>Referral Code: ${referralCode}</p>
            <p>This commission will be available for withdrawal after the 7-day holding period.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/partners/dashboard" style="color: #00F5FF;">View Your Dashboard</a></p>
            <p>Best regards,<br>AutoLearn Spot Team</p>
          </div>
        `
      });

      return true;
    } catch (error) {
      console.error('Error sending commission earned email:', error);
      return false;
    }
  }

  /**
   * Send withdrawal approved email
   */
  static async sendWithdrawalApprovedEmail(partnerId: string, amount: number): Promise<boolean> {
    try {
      const { data: partner, error } = await supabase
        .from('partners')
        .select('full_name, email')
        .eq('id', partnerId)
        .single();

      if (error || !partner) {
        console.error('Partner not found:', error);
        return false;
      }

      const { EmailService } = await import('@/lib/email/EmailService');
      
      await EmailService.sendEmail({
        to: partner.email,
        subject: `Withdrawal Approved - ₦${amount}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00F5FF;">Withdrawal Approved</h2>
            <p>Dear ${partner.full_name},</p>
            <p>Your withdrawal request of <strong>₦${amount}</strong> has been approved.</p>
            <p>Payment will be processed shortly. You will receive another notification once the payment has been completed.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/partners/dashboard" style="color: #00F5FF;">View Your Dashboard</a></p>
            <p>Best regards,<br>AutoLearn Spot Team</p>
          </div>
        `
      });

      return true;
    } catch (error) {
      console.error('Error sending withdrawal approved email:', error);
      return false;
    }
  }

  /**
   * Send withdrawal paid email
   */
  static async sendWithdrawalPaidEmail(partnerId: string, amount: number, paymentReference: string): Promise<boolean> {
    try {
      const { data: partner, error } = await supabase
        .from('partners')
        .select('full_name, email')
        .eq('id', partnerId)
        .single();

      if (error || !partner) {
        console.error('Partner not found:', error);
        return false;
      }

      const { EmailService } = await import('@/lib/email/EmailService');
      
      await EmailService.sendEmail({
        to: partner.email,
        subject: `Payment Completed - ₦${amount}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00F5FF;">Payment Completed</h2>
            <p>Dear ${partner.full_name},</p>
            <p>Your withdrawal of <strong>₦${amount}</strong> has been successfully paid to your bank account.</p>
            <p>Payment Reference: ${paymentReference}</p>
            <p>Thank you for being a valued partner. Keep up the great work!</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/partners/dashboard" style="color: #00F5FF;">View Your Dashboard</a></p>
            <p>Best regards,<br>AutoLearn Spot Team</p>
          </div>
        `
      });

      return true;
    } catch (error) {
      console.error('Error sending withdrawal paid email:', error);
      return false;
    }
  }

  /**
   * Send marketing kit updated email
   */
  static async sendMarketingKitUpdatedEmail(partnerId: string, newResources: string[]): Promise<boolean> {
    try {
      const { data: partner, error } = await supabase
        .from('partners')
        .select('full_name, email')
        .eq('id', partnerId)
        .single();

      if (error || !partner) {
        console.error('Partner not found:', error);
        return false;
      }

      const { EmailService } = await import('@/lib/email/EmailService');
      
      const resourcesList = newResources.map(r => `<li>${r}</li>`).join('');
      
      await EmailService.sendEmail({
        to: partner.email,
        subject: 'New Marketing Materials Available',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00F5FF;">New Marketing Materials</h2>
            <p>Dear ${partner.full_name},</p>
            <p>We've added new marketing materials to help you promote AutoLearn Spot more effectively:</p>
            <ul>
              ${resourcesList}
            </ul>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/partners/dashboard?tab=marketing" style="color: #00F5FF;">Download Marketing Kit</a></p>
            <p>Best regards,<br>AutoLearn Spot Team</p>
          </div>
        `
      });

      return true;
    } catch (error) {
      console.error('Error sending marketing kit updated email:', error);
      return false;
    }
  }
}