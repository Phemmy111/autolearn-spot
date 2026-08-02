/**
 * Scholarship Payment Configuration
 * 
 * This configuration is for the ₦5,000 Scholarship flow only.
 * The Direct Enrollment flow (₦8,000) has its own separate configuration in config/direct-enrollment.ts.
 * 
 * CRITICAL: These two flows must NEVER be merged or share payment links.
 */

export const scholarshipConfig = {
  // Scholarship Financials
  // Full course value is ₦8,000, scholarship applicants pay commitment fee of ₦5,000
  fullValue: 8000, // The full value of the course (₦8,000)
  commitmentFee: 5000, // What scholarship applicants actually pay (₦5,000)
  
  // Program Dates & Timelines
  // ISO 8601 string formats
  applicationOpeningDate: '2026-01-01T00:00:00Z',
  applicationClosingDate: '2026-12-31T23:59:59Z',
  reviewPeriodDays: 3,
  cohortStartDate: '2027-01-15T00:00:00Z',
  
  // Payment Configuration
  // TEST MODE - Currently using test payment link
  paystackMode: 'test' as 'test' | 'live', // Switch to 'live' when going to production
  paymentUrl: process.env.NEXT_PUBLIC_PAYSTACK_SCHOLARSHIP_URL || 'https://paystack.shop/pay/lk12tlisnj',
  livePaymentUrl: process.env.NEXT_PUBLIC_PAYSTACK_SCHOLARSHIP_LIVE_URL || '',
  
  // When switching to live mode:
  // 1. Change paystackMode to 'live'
  // 2. Set NEXT_PUBLIC_PAYSTACK_SCHOLARSHIP_LIVE_URL environment variable
  // 3. Configure webhook URL in Paystack live dashboard: https://autolearn-spot.vercel.app/api/webhook/paystack
  // 4. Ensure PAYSTACK_WEBHOOK_SECRET is set in Vercel (for live mode)
  // 5. Ensure PAYSTACK_TEST_WEBHOOK_SECRET is set in Vercel (for test mode)
  
  // WhatsApp Group Links
  generalWhatsAppGroup: 'https://chat.whatsapp.com/DJrJYaW3nIy74xtFnZlJM3?s=cl&p=a&ilr=1&amv=3', // For all applicants
  paidWhatsAppGroup: 'https://chat.whatsapp.com/DFTf7Z8il048brWDsvxUHA?s=cl&p=a&ilr=1&amv=3', // For paid students only
  
  // Settings
  isOpen: true, // Master toggle to easily close applications
};
