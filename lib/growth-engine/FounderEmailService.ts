import { createClient } from '@supabase/supabase-js';
import { FOUNDER_CONFIG, type FounderNotificationType } from '@/config/founder';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Founder Email Service
 * 
 * Handles all email notifications sent to the founder for important business events.
 */

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class FounderEmailService {
  private founderEmail: string;

  constructor() {
    this.founderEmail = FOUNDER_CONFIG.email;
  }

  /**
   * Send an email to the founder
   */
  async sendEmail(data: EmailData): Promise<boolean> {
    try {
      // This would typically use an email service like Resend, SendGrid, etc.
      // For now, we'll log it and store in the database
      console.log('[Founder Email]', {
        to: data.to,
        subject: data.subject,
      });

      // Store notification in database
      await supabaseAdmin.from('founder_notifications').insert({
        notification_type: this.extractNotificationType(data.subject),
        subject: data.subject,
        content: data.html,
        sent_to: data.to,
        status: 'sent',
        created_at: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      console.error('Failed to send founder email:', error);
      
      // Log the failure
      await supabaseAdmin.from('founder_notifications').insert({
        notification_type: 'email_failure',
        subject: '❌ Email Delivery Failed',
        content: `Failed to send email: ${data.subject}`,
        sent_to: data.to,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        created_at: new Date().toISOString(),
      });

      return false;
    }
  }

  /**
   * Extract notification type from subject
   */
  private extractNotificationType(subject: string): FounderNotificationType {
    if (subject.includes('New Student')) return 'new_registration';
    if (subject.includes('Payment Received')) return 'payment_received';
    if (subject.includes('Scholarship Payment')) return 'scholarship_payment';
    if (subject.includes('Community Partner Application')) return 'partner_application';
    if (subject.includes('Partner Approved')) return 'partner_approved';
    if (subject.includes('Influencer Added')) return 'influencer_created';
    if (subject.includes('Withdrawal Request')) return 'withdrawal_request';
    if (subject.includes('Withdrawal Completed')) return 'withdrawal_paid';
    if (subject.includes('Fraud Alert')) return 'fraud_alert';
    if (subject.includes('Webhook Failed')) return 'webhook_failure';
    if (subject.includes('Email Delivery Failed')) return 'email_failure';
    if (subject.includes('System Error')) return 'system_error';
    return 'system_error';
  }

  /**
   * EMAIL 1: New Registration
   */
  async sendNewRegistration(data: {
    name: string;
    email: string;
    phone: string;
    registrationType: 'direct_enrollment' | 'scholarship';
    referralCode?: string;
    referrer?: string;
  }): Promise<boolean> {
    const subject = '🎉 New Student Registered';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00f0ff;">${subject}</h2>
        <p>A new student has registered on AutoLearn Spot:</p>
        
        <div style="background: #111317; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Phone:</strong> ${data.phone}</p>
          <p><strong>Registration Type:</strong> ${data.registrationType === 'direct_enrollment' ? 'Direct Enrollment' : 'Scholarship'}</p>
          ${data.referralCode ? `<p><strong>Referral Code:</strong> ${data.referralCode}</p>` : ''}
          ${data.referrer ? `<p><strong>Referred By:</strong> ${data.referrer}</p>` : ''}
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <p>Check the admin dashboard for more details.</p>
      </div>
    `;

    return this.sendEmail({ to: this.founderEmail, subject, html });
  }

  /**
   * EMAIL 2: Payment Received
   */
  async sendPaymentReceived(data: {
    studentName: string;
    email: string;
    amount: number;
    paymentType: 'direct_enrollment' | 'scholarship';
    reference: string;
    referrer?: string;
    commissionGenerated?: number;
  }): Promise<boolean> {
    const subject = '💰 Payment Received';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00f0ff;">${subject}</h2>
        <p>Payment has been received:</p>
        
        <div style="background: #111317; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Student Name:</strong> ${data.studentName}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Amount:</strong> ₦${data.amount.toLocaleString()}</p>
          <p><strong>Payment Type:</strong> ${data.paymentType === 'direct_enrollment' ? 'Direct Enrollment' : 'Scholarship'}</p>
          <p><strong>Reference:</strong> ${data.reference}</p>
          ${data.referrer ? `<p><strong>Referrer:</strong> ${data.referrer}</p>` : ''}
          ${data.commissionGenerated ? `<p><strong>Commission Generated:</strong> ₦${data.commissionGenerated.toLocaleString()}</p>` : ''}
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <p>Payment has been verified and student access granted.</p>
      </div>
    `;

    return this.sendEmail({ to: this.founderEmail, subject, html });
  }

  /**
   * EMAIL 3: Scholarship Payment
   */
  async sendScholarshipPayment(data: {
    applicationId: string;
    referenceNumber: string;
    applicantName: string;
    email: string;
    amount: number;
    reference: string;
  }): Promise<boolean> {
    const subject = '🎓 Scholarship Payment Received';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00f0ff;">${subject}</h2>
        <p>Scholarship payment has been received:</p>
        
        <div style="background: #111317; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Application ID:</strong> ${data.applicationId}</p>
          <p><strong>Reference Number:</strong> ${data.referenceNumber}</p>
          <p><strong>Applicant Name:</strong> ${data.applicantName}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Amount:</strong> ₦${data.amount.toLocaleString()}</p>
          <p><strong>Paystack Reference:</strong> ${data.reference}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <p>Applicant will be onboarded to the scholarship program.</p>
      </div>
    `;

    return this.sendEmail({ to: this.founderEmail, subject, html });
  }

  /**
   * EMAIL 4: Community Partner Application
   */
  async sendPartnerApplication(data: {
    name: string;
    email: string;
    phone: string;
    state: string;
    socialLinks: string;
    marketingPlan: string;
    motivation: string;
  }): Promise<boolean> {
    const subject = '🤝 New Community Partner Application';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00f0ff;">${subject}</h2>
        <p>A new Community Partner application has been submitted:</p>
        
        <div style="background: #111317; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Phone:</strong> ${data.phone}</p>
          <p><strong>State:</strong> ${data.state}</p>
          <p><strong>Social Links:</strong> ${data.socialLinks}</p>
          <p><strong>Marketing Plan:</strong></p>
          <p style="background: #0c0e12; padding: 10px; border-radius: 4px;">${data.marketingPlan}</p>
          <p><strong>Motivation:</strong></p>
          <p style="background: #0c0e12; padding: 10px; border-radius: 4px;">${data.motivation}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <p>Review the application in the Admin Growth Center.</p>
      </div>
    `;

    return this.sendEmail({ to: this.founderEmail, subject, html });
  }

  /**
   * EMAIL 5: Partner Approved
   */
  async sendPartnerApproved(data: {
    partnerName: string;
    email: string;
    partnerType: 'community' | 'influencer';
    referralCode: string;
  }): Promise<boolean> {
    const subject = '✅ Community Partner Approved';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00f0ff;">${subject}</h2>
        <p>A partner has been approved:</p>
        
        <div style="background: #111317; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Partner Name:</strong> ${data.partnerName}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Partner Type:</strong> ${data.partnerType}</p>
          <p><strong>Referral Code:</strong> ${data.referralCode}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <p>Partner can now access their dashboard and start referring.</p>
      </div>
    `;

    return this.sendEmail({ to: this.founderEmail, subject, html });
  }

  /**
   * EMAIL 6: Influencer Created
   */
  async sendInfluencerCreated(data: {
    name: string;
    email: string;
    commissionRate: number;
    referralCode: string;
  }): Promise<boolean> {
    const subject = '⭐ New Influencer Added';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00f0ff;">${subject}</h2>
        <p>A new influencer has been added to the system:</p>
        
        <div style="background: #111317; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Commission Rate:</strong> ₦${data.commissionRate.toLocaleString()}</p>
          <p><strong>Referral Code:</strong> ${data.referralCode}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <p>Influencer is now active and can start their campaigns.</p>
      </div>
    `;

    return this.sendEmail({ to: this.founderEmail, subject, html });
  }

  /**
   * EMAIL 7: Withdrawal Request
   */
  async sendWithdrawalRequest(data: {
    partnerName: string;
    partnerType: string;
    amount: number;
    bankName: string;
    accountName: string;
    accountNumber: string;
  }): Promise<boolean> {
    const subject = '💳 Withdrawal Request';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00f0ff;">${subject}</h2>
        <p>A withdrawal request has been submitted:</p>
        
        <div style="background: #111317; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Partner:</strong> ${data.partnerName}</p>
          <p><strong>Partner Type:</strong> ${data.partnerType}</p>
          <p><strong>Amount:</strong> ₦${data.amount.toLocaleString()}</p>
          <p><strong>Bank:</strong> ${data.bankName}</p>
          <p><strong>Account Name:</strong> ${data.accountName}</p>
          <p><strong>Account Number:</strong> ${data.accountNumber}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <p>Process the withdrawal in the Admin Growth Center.</p>
      </div>
    `;

    return this.sendEmail({ to: this.founderEmail, subject, html });
  }

  /**
   * EMAIL 8: Withdrawal Paid
   */
  async sendWithdrawalPaid(data: {
    partnerName: string;
    amount: number;
    reference: string;
  }): Promise<boolean> {
    const subject = '✅ Withdrawal Completed';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00f0ff;">${subject}</h2>
        <p>A withdrawal has been completed:</p>
        
        <div style="background: #111317; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Partner:</strong> ${data.partnerName}</p>
          <p><strong>Amount:</strong> ₦${data.amount.toLocaleString()}</p>
          <p><strong>Reference:</strong> ${data.reference}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <p>Withdrawal has been successfully processed.</p>
      </div>
    `;

    return this.sendEmail({ to: this.founderEmail, subject, html });
  }

  /**
   * EMAIL 9: Fraud Alert
   */
  async sendFraudAlert(data: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    reason: string;
    partner?: string;
    referral?: string;
    evidence?: string;
  }): Promise<boolean> {
    const subject = '🚨 Fraud Alert';
    const severityColors = {
      low: '#00ff00',
      medium: '#ffff00',
      high: '#ff9900',
      critical: '#ff0000',
    };

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${severityColors[data.severity]};">${subject}</h2>
        <p><strong>Severity:</strong> ${data.severity.toUpperCase()}</p>
        
        <div style="background: #111317; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid ${severityColors[data.severity]};">
          <p><strong>Reason:</strong> ${data.reason}</p>
          ${data.partner ? `<p><strong>Partner:</strong> ${data.partner}</p>` : ''}
          ${data.referral ? `<p><strong>Referral:</strong> ${data.referral}</p>` : ''}
          ${data.evidence ? `<p><strong>Evidence:</strong></p><p style="background: #0c0e12; padding: 10px; border-radius: 4px;">${data.evidence}</p>` : ''}
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <p>Review this alert immediately in the Admin Growth Center.</p>
      </div>
    `;

    return this.sendEmail({ to: this.founderEmail, subject, html });
  }

  /**
   * EMAIL 10: Webhook Failure
   */
  async sendWebhookFailure(data: {
    reference: string;
    reason: string;
    stackTrace?: string;
  }): Promise<boolean> {
    const subject = '❌ Paystack Webhook Failed';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff0000;">${subject}</h2>
        <p>A Paystack webhook has failed:</p>
        
        <div style="background: #111317; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #ff0000;">
          <p><strong>Reference:</strong> ${data.reference}</p>
          <p><strong>Reason:</strong> ${data.reason}</p>
          ${data.stackTrace ? `<p><strong>Stack Trace:</strong></p><pre style="background: #0c0e12; padding: 10px; border-radius: 4px; overflow-x: auto;">${data.stackTrace}</pre>` : ''}
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <p>Investigate and resolve this issue immediately.</p>
      </div>
    `;

    return this.sendEmail({ to: this.founderEmail, subject, html });
  }

  /**
   * EMAIL 11: Email Failure
   */
  async sendEmailFailure(data: {
    recipient: string;
    subject: string;
    reason: string;
  }): Promise<boolean> {
    const subject = '❌ Email Delivery Failed';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff0000;">${subject}</h2>
        <p>An email delivery has failed:</p>
        
        <div style="background: #111317; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #ff0000;">
          <p><strong>Recipient:</strong> ${data.recipient}</p>
          <p><strong>Subject:</strong> ${data.subject}</p>
          <p><strong>Reason:</strong> ${data.reason}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <p>Check email service configuration and try again.</p>
      </div>
    `;

    return this.sendEmail({ to: this.founderEmail, subject, html });
  }

  /**
   * EMAIL 12: System Error
   */
  async sendSystemError(data: {
    error: string;
    context?: string;
    stackTrace?: string;
  }): Promise<boolean> {
    const subject = '❌ Unexpected System Error';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff0000;">${subject}</h2>
        <p>An unexpected system error has occurred:</p>
        
        <div style="background: #111317; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #ff0000;">
          <p><strong>Error:</strong> ${data.error}</p>
          ${data.context ? `<p><strong>Context:</strong> ${data.context}</p>` : ''}
          ${data.stackTrace ? `<p><strong>Stack Trace:</strong></p><pre style="background: #0c0e12; padding: 10px; border-radius: 4px; overflow-x: auto;">${data.stackTrace}</pre>` : ''}
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <p>Investigate and resolve this issue immediately.</p>
      </div>
    `;

    return this.sendEmail({ to: this.founderEmail, subject, html });
  }
}

const founderEmailService = new FounderEmailService();
export { founderEmailService as FounderEmailService };