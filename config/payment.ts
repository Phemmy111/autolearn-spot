/**
 * Centralized Payment Configuration
 * 
 * This file manages BOTH payment flows for AutoLearn Spot:
 * 1. Scholarship Flow (₦5,000) - For approved scholarship applicants
 * 2. Direct Enrollment Flow (₦8,000) - For regular students
 * 
 * CRITICAL: These flows are COMPLETELY INDEPENDENT and must NEVER be merged.
 */

export type PaymentFlow = 'scholarship' | 'direct-enrollment';

export interface PaymentConfig {
  flow: PaymentFlow;
  amount: number;
  currency: string;
  name: string;
  description: string;
  testUrl: string;
  liveUrl: string;
  useTestMode: boolean;
}

/**
 * Get payment configuration for a specific flow
 * @param flow - The payment flow ('scholarship' or 'direct-enrollment')
 * @returns Payment configuration object
 */
export function getPaymentConfig(flow: PaymentFlow): PaymentConfig {
  const isTestMode = process.env.NODE_ENV !== 'production';

  if (flow === 'scholarship') {
    return {
      flow: 'scholarship',
      amount: 5000,
      currency: 'NGN',
      name: 'AutoLearn Spot Scholarship Program',
      description: 'Scholarship commitment fee for approved applicants',
      testUrl: process.env.NEXT_PUBLIC_PAYSTACK_SCHOLARSHIP_URL || 'https://paystack.shop/pay/lk12tlisnj',
      liveUrl: process.env.NEXT_PUBLIC_PAYSTACK_SCHOLARSHIP_LIVE_URL || 'https://paystack.shop/pay/lk12tlisnj',
      useTestMode: isTestMode,
    };
  }

  if (flow === 'direct-enrollment') {
    return {
      flow: 'direct-enrollment',
      amount: 8000,
      currency: 'NGN',
      name: 'AutoLearn Spot Direct Enrollment',
      description: '4-week hands-on n8n automation training',
      testUrl: process.env.NEXT_PUBLIC_PAYSTACK_DIRECT_ENROLLMENT_URL || 'https://paystack.shop/pay/wnkntnzlcd',
      liveUrl: process.env.NEXT_PUBLIC_PAYSTACK_DIRECT_ENROLLMENT_LIVE_URL || 'https://paystack.shop/pay/wnkntnzlcd',
      useTestMode: isTestMode,
    };
  }

  throw new Error(`Invalid payment flow: ${flow}`);
}

/**
 * Get the appropriate Paystack URL for a given flow
 * @param flow - The payment flow ('scholarship' or 'direct-enrollment')
 * @returns The Paystack payment URL
 */
export function getPaymentUrl(flow: PaymentFlow): string {
  const config = getPaymentConfig(flow);
  return config.useTestMode ? config.testUrl : config.liveUrl;
}

/**
 * Validate that a payment amount matches the expected flow
 * @param amount - The payment amount in Naira
 * @param expectedFlow - The expected payment flow
 * @returns true if the amount matches the expected flow
 */
export function validatePaymentAmount(amount: number, expectedFlow: PaymentFlow): boolean {
  const config = getPaymentConfig(expectedFlow);
  return amount === config.amount;
}

/**
 * Get flow type from payment amount
 * @param amount - The payment amount in Naira
 * @returns The payment flow type or null if amount doesn't match any flow
 */
export function getFlowFromAmount(amount: number): PaymentFlow | null {
  if (amount === 5000) return 'scholarship';
  if (amount === 8000) return 'direct-enrollment';
  return null;
}