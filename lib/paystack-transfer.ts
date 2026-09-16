/**
 * Paystack Transfer Service
 * Handles creating transfer recipients and initiating transfers to author bank accounts
 */

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_TEST_SECRET_KEY || '';
const PAYSTACK_BASE_URL = process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co';

interface TransferRecipient {
  recipient_code: string;
  name: string;
  account_number: string;
  bank_code: string;
}

interface TransferResponse {
  status: boolean;
  message: string;
  data: {
    reference: string;
    amount: number;
    status: string;
    transfer_code: string;
  };
}

/**
 * Create a transfer recipient from bank account details
 */
export async function createTransferRecipient(
  accountNumber: string,
  bankCode: string,
  accountName: string
): Promise<TransferRecipient> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('Paystack secret key not configured');
  }

  console.log('Creating transfer recipient:', {
    accountNumber,
    bankCode,
    accountName,
    baseUrl: PAYSTACK_BASE_URL,
    hasKey: !!PAYSTACK_SECRET_KEY
  });

  const url = `${PAYSTACK_BASE_URL}/transferrecipient`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'nuban',
      name: accountName,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: 'NGN',
    }),
  });

  const data = await response.json();

  console.log('Transfer recipient response:', {
    status: response.status,
    dataStatus: data.status,
    dataMessage: data.message,
    fullResponse: data
  });

  if (!data.status) {
    throw new Error(`Failed to create transfer recipient: ${data.message}`);
  }

  return {
    recipient_code: data.data.recipient_code,
    name: data.data.name,
    account_number: data.data.details.account_number,
    bank_code: data.data.details.bank_code,
  };
}

/**
 * Initiate a transfer to a recipient
 */
export async function initiateTransfer(
  recipientCode: string,
  amount: number, // in Naira
  reference: string,
  reason?: string
): Promise<TransferResponse> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('Paystack secret key not configured');
  }

  console.log('Initiating transfer:', {
    recipientCode,
    amount,
    reference,
    reason,
    baseUrl: PAYSTACK_BASE_URL,
    hasKey: !!PAYSTACK_SECRET_KEY
  });

  const url = `${PAYSTACK_BASE_URL}/transfer`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source: 'balance',
      amount: amount * 100, // Convert to kobo
      recipient: recipientCode,
      reference: reference,
      reason: reason || 'Author withdrawal',
    }),
  });

  const data = await response.json();

  console.log('Transfer response:', {
    status: response.status,
    dataStatus: data.status,
    dataMessage: data.message,
    fullResponse: data
  });

  if (!data.status) {
    throw new Error(`Failed to initiate transfer: ${data.message}`);
  }

  return {
    status: data.status,
    message: data.message,
    data: {
      reference: data.data.reference,
      amount: data.data.amount,
      status: data.data.status,
      transfer_code: data.data.transfer_code,
    },
  };
}

/**
 * Get transfer status
 */
export async function getTransferStatus(reference: string): Promise<any> {
  const url = `${PAYSTACK_BASE_URL}/transfer/verify/${reference}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  });

  const data = await response.json();

  if (!data.status) {
    throw new Error(`Failed to get transfer status: ${data.message}`);
  }

  return data.data;
}

/**
 * Get list of Nigerian banks
 */
export async function getBanks(): Promise<any[]> {
  const url = `${PAYSTACK_BASE_URL}/bank`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  });

  const data = await response.json();

  if (!data.status) {
    throw new Error(`Failed to get banks: ${data.message}`);
  }

  return data.data;
}
