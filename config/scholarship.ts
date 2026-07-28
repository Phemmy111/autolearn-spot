export const scholarshipConfig = {
  // Scholarship Financials
  fullValue: 50000,
  commitmentFee: 5000,
  
  // Program Dates & Timelines
  // ISO 8601 string formats
  applicationOpeningDate: '2026-01-01T00:00:00Z',
  applicationClosingDate: '2026-12-31T23:59:59Z',
  reviewPeriodDays: 3,
  cohortStartDate: '2027-01-15T00:00:00Z',
  
  // Payment Configuration
  // TEST MODE - Currently using test payment link
  paystackMode: 'test' as 'test' | 'live', // Switch to 'live' when going to production
  paymentUrl: 'https://paystack.shop/pay/lk12tlisnj',
  
  // When switching to live mode:
  // 1. Change paystackMode to 'live'
  // 2. Replace paymentUrl with live Paystack payment link
  // 3. Configure webhook URL in Paystack live dashboard: https://autolearn-spot.vercel.app/api/webhook/paystack
  // 4. Ensure PAYSTACK_WEBHOOK_SECRET is set in Vercel (for live mode)
  // 5. Ensure PAYSTACK_TEST_WEBHOOK_SECRET is set in Vercel (for test mode)
  
  // WhatsApp Group Links
  generalWhatsAppGroup: 'https://chat.whatsapp.com/DJrJYaW3nIy74xtFnZlJM3?s=cl&p=a&ilr=1&amv=3', // For all applicants
  paidWhatsAppGroup: 'https://chat.whatsapp.com/DFTf7Z8il048brWDsvxUHA?s=cl&p=a&ilr=1&amv=3', // For paid students only
  
  // Settings
  isOpen: true, // Master toggle to easily close applications
};
