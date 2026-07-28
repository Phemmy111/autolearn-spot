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
  // TEST MODE - Replace with live payment URL when ready
  paymentUrl: 'https://paystack.shop/pay/lk12tlisnj',
  
  // Settings
  isOpen: true, // Master toggle to easily close applications
};
