/**
 * Direct Enrollment Payment Configuration
 * 
 * This configuration is for the ₦8,000 Direct Enrollment flow only.
 * The Scholarship flow (₦5,000) has its own separate configuration in config/scholarship.ts.
 * 
 * CRITICAL: These two flows must NEVER be merged or share payment links.
 */

export const DIRECT_ENROLLMENT_CONFIG = {
  // Pricing
  price: 8000,
  currency: 'NGN',
  name: 'AutoLearn Spot Direct Enrollment',
  description: '4-week hands-on n8n automation training',

  // Paystack Configuration
  paystack: {
    // Test URL for Direct Enrollment (₦8,000)
    testUrl: process.env.NEXT_PUBLIC_PAYSTACK_DIRECT_ENROLLMENT_URL || 'https://paystack.shop/pay/wnkntnzlcd',
    // Live URL (to be configured in production environment variable)
    liveUrl: process.env.NEXT_PUBLIC_PAYSTACK_DIRECT_ENROLLMENT_LIVE_URL || '',
    // Use test mode by default
    useTestMode: process.env.NODE_ENV !== 'production',
  },

  // Commission Configuration
  commissions: {
    studentPartner: 1500,
    communityPartner: 1500,
    influencer: 2500,
    holdingPeriodDays: 7,
  },

  // Enrollment Settings
  enrollment: {
    pendingExpiryHours: 24, // Pending enrollment expires after 24 hours
    requirePhoneVerification: false,
    requireEmailVerification: false,
  },

  // Features
  features: [
    '4-week intensive training',
    'Hands-on n8n automation',
    'Live weekly sessions',
    'Project-based learning',
    'Certificate of completion',
    'Lifetime access to materials',
    'Community support',
  ],
} as const;

export type DirectEnrollmentConfig = typeof DIRECT_ENROLLMENT_CONFIG;