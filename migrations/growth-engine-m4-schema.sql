-- AutoLearn Spot Growth Engine Milestone 4 Schema
-- Withdrawals Engine tables

-- 1. Create Withdrawals table
CREATE TABLE IF NOT EXISTS public.withdrawals (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id TEXT NOT NULL, user_type TEXT NOT NULL DEFAULT 'student', amount INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')), bank_name TEXT, account_number TEXT, account_name TEXT, payment_reference TEXT, rejection_reason TEXT, admin_notes TEXT, processed_by TEXT, processed_at TIMESTAMP WITH TIME ZONE, created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL, updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL);

-- 2. Create Withdrawal_Commissions junction table
CREATE TABLE IF NOT EXISTS public.withdrawal_commissions (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, withdrawal_id UUID NOT NULL REFERENCES public.withdrawals(id) ON DELETE CASCADE, commission_id UUID NOT NULL REFERENCES public.commissions(id) ON DELETE CASCADE, amount INTEGER NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL, UNIQUE(withdrawal_id, commission_id));

-- Add withdrawal_id to commissions safely
DO $$ BEGIN IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'commissions') THEN ALTER TABLE public.commissions ADD COLUMN IF NOT EXISTS withdrawal_id UUID REFERENCES public.withdrawals(id); END IF; END $$;

-- 3. Row Level Security for withdrawals
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own withdrawals" ON public.withdrawals FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);
CREATE POLICY "Users can insert own withdrawals" ON public.withdrawals FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);
CREATE POLICY "Admins can read all withdrawals" ON public.withdrawals FOR SELECT USING (auth.jwt() ->> 'role' = 'super_admin' OR auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can update all withdrawals" ON public.withdrawals FOR UPDATE USING (auth.jwt() ->> 'role' = 'super_admin' OR auth.jwt() ->> 'role' = 'admin');

-- 4. Row Level Security for withdrawal_commissions
ALTER TABLE public.withdrawal_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own withdrawal_commissions" ON public.withdrawal_commissions FOR SELECT USING (EXISTS (SELECT 1 FROM public.withdrawals w WHERE w.id = withdrawal_commissions.withdrawal_id AND w.user_id = auth.jwt() ->> 'sub'));
CREATE POLICY "Admins can read all withdrawal_commissions" ON public.withdrawal_commissions FOR SELECT USING (auth.jwt() ->> 'role' = 'super_admin' OR auth.jwt() ->> 'role' = 'admin');

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created ON public.withdrawals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawal_commissions_withdrawal ON public.withdrawal_commissions(withdrawal_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_commissions_commission ON public.withdrawal_commissions(commission_id);
