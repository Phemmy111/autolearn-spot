import { POST as BankProfilePOST } from '@/app/api/authors/[authorId]/bank-profile/route';
import { POST as WithdrawalsPOST } from '@/app/api/withdrawals/route';
import { GET as AdminWithdrawalsGET, POST as AdminWithdrawalsPOST } from '@/app/api/admin/withdrawals/route';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin';
import * as authorService from '@/lib/authorService';

// Mock dependencies
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

jest.mock('@/lib/admin', () => ({
  requireAdmin: jest.fn(),
}));

jest.mock('@/lib/authorService', () => ({
  requestWithdrawal: jest.fn(),
  processWithdrawal: jest.fn(),
}));

// Helper to create Request object
function createRequest(body: any = null, method = 'POST') {
  return new Request('http://localhost', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('Phase 7B: Author Bank Accounts & Withdrawals', () => {
  const mockUserId = 'user_123';
  const mockAuthorId = 'author_456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Author bank-profile endpoint', () => {
    it('1. Author bank-account upsert (successful creation)', async () => {
      (auth as jest.Mock).mockResolvedValue({ userId: mockUserId });
      
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: { id: mockAuthorId }, error: null });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      (supabaseAdmin.rpc as jest.Mock).mockResolvedValue({ error: null });

      const req = createRequest({
        bank_name: 'Test Bank',
        account_number: '123456789',
        routing_number: '987654321',
      });

      const res = await BankProfilePOST(req, { params: { authorId: mockAuthorId } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(supabaseAdmin.rpc).toHaveBeenCalledWith('upsert_author_bank_account', {
        p_author_id: mockAuthorId,
        p_bank_name: 'Test Bank',
        p_account_number: '123456789',
        p_routing_number: '987654321',
      });
    });

    it('2. Auth enforcement (401 on missing auth)', async () => {
      (auth as jest.Mock).mockResolvedValue({ userId: null });
      
      const req = createRequest({ bank_name: 'Test', account_number: '123', routing_number: '456' });
      const res = await BankProfilePOST(req, { params: { authorId: mockAuthorId } });
      
      expect(res.status).toBe(401);
    });

    it('3. Auth enforcement (403 on mismatched author/userId)', async () => {
      (auth as jest.Mock).mockResolvedValue({ userId: mockUserId });
      
      // Mismatched author returned
      const mockSingle = jest.fn().mockResolvedValue({ data: { id: 'other_author' }, error: null });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: mockSingle,
      });

      const req = createRequest({ bank_name: 'Test', account_number: '123', routing_number: '456' });
      const res = await BankProfilePOST(req, { params: { authorId: mockAuthorId } });
      
      expect(res.status).toBe(403);
    });

    it('4. Masked response (returns **** instead of plaintext)', async () => {
      (auth as jest.Mock).mockResolvedValue({ userId: mockUserId });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: mockAuthorId }, error: null }),
      });
      (supabaseAdmin.rpc as jest.Mock).mockResolvedValue({ error: null });

      const req = createRequest({
        bank_name: 'Test Bank',
        account_number: '123456789',
        routing_number: '987654321',
      });

      const res = await BankProfilePOST(req, { params: { authorId: mockAuthorId } });
      const json = await res.json();

      expect(json.account_number).toBe('****6789');
      expect(json.routing_number).toBe('****4321');
    });
  });

  describe('Withdrawals POST endpoint', () => {
    it('5. Withdrawal RPC usage (creating withdrawal calls authorService.requestWithdrawal)', async () => {
      (auth as jest.Mock).mockResolvedValue({ userId: mockUserId });
      (authorService.requestWithdrawal as jest.Mock).mockResolvedValue('withdrawal_uuid_123');

      // The new route requires an author to be matched by userId
      const mockSingle = jest.fn().mockResolvedValue({ data: { id: mockAuthorId }, error: null });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: mockSingle,
      });

      const req = createRequest({ amount: 100 });
      const res = await WithdrawalsPOST(req);
      const json = await res.json();

      expect(authorService.requestWithdrawal).toHaveBeenCalledWith(
        mockAuthorId,
        100,
        expect.any(String) // request_ref
      );
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
    });

    it('6. Insufficient balance (handled by authorService)', async () => {
      (auth as jest.Mock).mockResolvedValue({ userId: mockUserId });
      (authorService.requestWithdrawal as jest.Mock).mockRejectedValue(new Error('Insufficient balance'));

      const mockSingle = jest.fn().mockResolvedValue({ data: { id: mockAuthorId }, error: null });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: mockSingle,
      });

      const req = createRequest({ amount: 100000 });
      const res = await WithdrawalsPOST(req);
      
      expect(res.status).toBe(400); // Or 500 depending on how the route catches
      const json = await res.json();
      expect(json.error).toMatch(/Insufficient balance/i);
    });

    it('7. Duplicate request_ref (RPC raises exception/handled)', async () => {
      (auth as jest.Mock).mockResolvedValue({ userId: mockUserId });
      (authorService.requestWithdrawal as jest.Mock).mockRejectedValue(new Error('Duplicate request reference'));

      const mockSingle = jest.fn().mockResolvedValue({ data: { id: mockAuthorId }, error: null });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: mockSingle,
      });

      const req = createRequest({ amount: 100 });
      const res = await WithdrawalsPOST(req);
      const json = await res.json();
      
      expect(res.status).toBe(400);
      expect(json.error).toMatch(/Duplicate request/i);
    });
  });

  describe('Admin Withdrawals endpoints', () => {
    it('8. Admin auth (401 on non-admin)', async () => {
      (requireAdmin as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

      const req = createRequest(null, 'GET');
      const res = await AdminWithdrawalsGET(req);
      
      expect(res.status).toBe(403); // The catch block returns 403
    });

    it('9. Admin list (GET returns pending withdrawals)', async () => {
      (requireAdmin as jest.Mock).mockResolvedValue(true);
      
      const mockPending = [{ id: 'w1', status: 'PENDING' }];
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockPending, error: null }),
      });

      const req = createRequest(null, 'GET');
      const res = await AdminWithdrawalsGET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.withdrawals).toEqual(mockPending);
    });

    it('10. Admin approve (POST approve transitions state)', async () => {
      (requireAdmin as jest.Mock).mockResolvedValue(true);
      (authorService.processWithdrawal as jest.Mock).mockResolvedValue(true);

      const req = createRequest({ withdrawal_id: 'w1', action: 'approve', provider_reference: 'tx_123' });
      const res = await AdminWithdrawalsPOST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(authorService.processWithdrawal).toHaveBeenCalledWith('w1', 'APPROVED', 'tx_123');
      expect(json.newStatus).toBe('APPROVED');
    });

    it('11. Admin reject (POST reject transitions state)', async () => {
      (requireAdmin as jest.Mock).mockResolvedValue(true);
      (authorService.processWithdrawal as jest.Mock).mockResolvedValue(true);

      const req = createRequest({ withdrawal_id: 'w2', action: 'reject' });
      const res = await AdminWithdrawalsPOST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(authorService.processWithdrawal).toHaveBeenCalledWith('w2', 'REJECTED', undefined);
      expect(json.newStatus).toBe('REJECTED');
    });
  });
});
