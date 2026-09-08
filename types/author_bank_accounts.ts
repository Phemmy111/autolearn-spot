export interface AuthorBankAccount {
  id: string;
  author_id: string;
  bank_name: string;
  account_number: string; // Typically exposed masked as '****1234'
  routing_number: string; // Typically exposed masked as '****5678'
  created_at: string;
  updated_at: string;
}

export interface BankProfileRequest {
  bank_name: string;
  account_number: string;
  routing_number: string;
}

export interface BankProfileResponse {
  success: boolean;
  bank_name: string;
  account_number: string;
  routing_number: string;
  error?: string;
}

export interface AdminWithdrawalActionPayload {
  withdrawal_id: string;
  action: 'approve' | 'reject';
  provider_reference?: string;
  notes?: string;
  reason?: string;
}
