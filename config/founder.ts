/**
 * Founder Notification Configuration
 * 
 * This configuration manages founder notifications and business summaries.
 */

export const FOUNDER_CONFIG = {
  // Founder contact information
  email: process.env.OWNER_EMAIL || 'femiadeleke2020@gmail.com',
  
  // Notification settings
  notifications: {
    newRegistration: true,
    paymentReceived: true,
    scholarshipPayment: true,
    partnerApplication: true,
    partnerApproved: true,
    influencerCreated: true,
    withdrawalRequest: true,
    withdrawalPaid: true,
    fraudAlert: true,
    webhookFailure: true,
    emailFailure: true,
    systemError: true,
  },
  
  // Summary settings
  summaries: {
    dailyEnabled: true,
    weeklyEnabled: true,
    dailySendTime: '18:00', // 6 PM
    weeklySendDay: 'Sunday', // Weekly summary on Sunday
    weeklySendTime: '18:00',
  },
  
  // Notification types
  notificationTypes: [
    'new_registration',
    'payment_received',
    'scholarship_payment',
    'partner_application',
    'partner_approved',
    'influencer_created',
    'withdrawal_request',
    'withdrawal_paid',
    'fraud_alert',
    'webhook_failure',
    'email_failure',
    'system_error',
  ] as const,
} as const;

export type FounderNotificationType = typeof FOUNDER_CONFIG.notificationTypes[number];