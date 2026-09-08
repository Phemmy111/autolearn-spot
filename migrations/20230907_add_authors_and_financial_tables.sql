-- Migration: Add authors and financial tables for Author Economy

-- 1. Create authors table
CREATE TABLE IF NOT EXISTS public.authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    bio TEXT,
    profile_image TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Extend learning_products with nullable author_id
ALTER TABLE public.learning_products
    ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.authors(id) ON DELETE SET NULL;

-- 3. Author sales table (one record per product sale attributable to author)
CREATE TABLE IF NOT EXISTS public.author_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    order_item_id UUID NOT NULL,
    product_id UUID NOT NULL REFERENCES public.learning_products(id) ON DELETE RESTRICT,
    author_id UUID NOT NULL REFERENCES public.authors(id) ON DELETE RESTRICT,
    gross_amount NUMERIC(12,2) NOT NULL,
    commission_amount NUMERIC(12,2) NOT NULL,
    net_amount NUMERIC(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NGN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (order_item_id)
);

-- 4. Author transactions (ledger)
CREATE TABLE IF NOT EXISTS public.author_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES public.authors(id) ON DELETE RESTRICT,
    type TEXT NOT NULL CHECK (type IN ('SALE_CREDIT','REFUND_DEBIT','WITHDRAWAL_DEBIT','WITHDRAWAL_REVERSAL','ADMIN_ADJUSTMENT')),
    amount NUMERIC(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NGN',
    related_id UUID, -- can reference author_sales, withdrawals, etc.
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Cached author earnings (fast queries)
CREATE TABLE IF NOT EXISTS public.author_earnings (
    author_id UUID PRIMARY KEY REFERENCES public.authors(id) ON DELETE CASCADE,
    total_gross NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_commission NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_net NUMERIC(12,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Bank accounts for payouts
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES public.authors(id) ON DELETE CASCADE,
    account_number TEXT NOT NULL,
    bank_code TEXT NOT NULL,
    account_name TEXT,
    paystack_recipient_code TEXT, -- stored after verification
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Author withdrawals
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'withdrawal_status') THEN
    CREATE TYPE withdrawal_status AS ENUM ('PENDING','APPROVED','PROCESSING','PAID','FAILED','REJECTED');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.author_withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES public.authors(id) ON DELETE RESTRICT,
    amount NUMERIC(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NGN',
    status withdrawal_status NOT NULL DEFAULT 'PENDING',
    provider TEXT NOT NULL DEFAULT 'PAYSTACK',
    provider_reference TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ,
    failure_reason TEXT,
    admin_note TEXT,
    UNIQUE (author_id, amount, requested_at) -- prevent duplicate requests for same amount at same time
);

-- 8. Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_author_sales_author_id ON public.author_sales(author_id);
CREATE INDEX IF NOT EXISTS idx_author_transactions_author_id ON public.author_transactions(author_id);
CREATE INDEX IF NOT EXISTS idx_author_withdrawals_author_id ON public.author_withdrawals(author_id);

-- 9. Trigger to update author_earnings on new author_sales
CREATE OR REPLACE FUNCTION public.update_author_earnings_on_sale() RETURNS trigger AS $$
BEGIN
    INSERT INTO public.author_earnings (author_id, total_gross, total_commission, total_net, updated_at)
    VALUES (NEW.author_id, NEW.gross_amount, NEW.commission_amount, NEW.net_amount, now())
    ON CONFLICT (author_id) DO UPDATE SET
        total_gross = author_earnings.total_gross + EXCLUDED.total_gross,
        total_commission = author_earnings.total_commission + EXCLUDED.total_commission,
        total_net = author_earnings.total_net + EXCLUDED.total_net,
        updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_author_earnings') THEN
    CREATE TRIGGER trg_update_author_earnings
    AFTER INSERT ON public.author_sales
    FOR EACH ROW EXECUTE FUNCTION public.update_author_earnings_on_sale();
  END IF;
END$$;

-- 10. Trigger to adjust author_earnings on refund/debit transactions (simplified)
CREATE OR REPLACE FUNCTION public.adjust_author_earnings_on_transaction() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.type = 'REFUND_DEBIT' THEN
            UPDATE public.author_earnings
            SET total_gross = total_gross - NEW.amount,
                total_net = total_net - NEW.amount,
                updated_at = now()
            WHERE author_id = NEW.author_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_adjust_author_earnings_on_tx') THEN
    CREATE TRIGGER trg_adjust_author_earnings_on_tx
    AFTER INSERT ON public.author_transactions
    FOR EACH ROW EXECUTE FUNCTION public.adjust_author_earnings_on_transaction();
  END IF;
END$$;

-- End of migration
