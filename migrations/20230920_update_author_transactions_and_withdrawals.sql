-- Migration: Update author_transactions and author_withdrawals for atomic financial core

-- 1. Add admin audit columns to author_transactions
ALTER TABLE public.author_transactions
  ADD COLUMN IF NOT EXISTS admin_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS reason TEXT NULL,
  ADD COLUMN IF NOT EXISTS adjustment_ref UUID NULL;

-- 2. Replace old transaction type CHECK constraint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.author_transactions'::regclass AND conname = 'author_transactions_type_check') THEN
    ALTER TABLE public.author_transactions DROP CONSTRAINT author_transactions_type_check;
  END IF;
END $$;

ALTER TABLE public.author_transactions
  ADD CONSTRAINT author_transactions_type_check CHECK (
    type IN (
      'SALE_CREDIT',
      'REFUND_DEBIT',
      'WITHDRAWAL_DEBIT',
      'WITHDRAWAL_REVERSAL',
      'ADMIN_CREDIT',
      'ADMIN_DEBIT'
    )
  );

-- 3. Migrate existing ADMIN_ADJUSTMENT rows if any
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id, amount FROM public.author_transactions WHERE type = 'ADMIN_ADJUSTMENT' LOOP
    IF r.amount > 0 THEN
      UPDATE public.author_transactions SET type = 'ADMIN_CREDIT' WHERE id = r.id;
    ELSIF r.amount < 0 THEN
      UPDATE public.author_transactions SET type = 'ADMIN_DEBIT', amount = -r.amount WHERE id = r.id;
    ELSE
      RAISE EXCEPTION 'Cannot determine admin adjustment direction for id % (amount zero)', r.id;
    END IF;
  END LOOP;
END $$;

-- 4. Add amount non‑negative check
ALTER TABLE public.author_transactions
  ADD CONSTRAINT author_transactions_amount_check CHECK (amount >= 0);

-- 5. Add partial unique indexes for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_author_tx_sale_credit
  ON public.author_transactions(author_id, related_id)
  WHERE type = 'SALE_CREDIT';

CREATE UNIQUE INDEX IF NOT EXISTS idx_author_tx_refund_debit
  ON public.author_transactions(author_id, related_id)
  WHERE type = 'REFUND_DEBIT';

CREATE UNIQUE INDEX IF NOT EXISTS idx_author_tx_withdrawal_debit
  ON public.author_transactions(author_id, related_id)
  WHERE type = 'WITHDRAWAL_DEBIT';

CREATE UNIQUE INDEX IF NOT EXISTS idx_author_tx_withdrawal_reversal
  ON public.author_transactions(author_id, related_id)
  WHERE type = 'WITHDRAWAL_REVERSAL';

CREATE UNIQUE INDEX IF NOT EXISTS idx_author_tx_admin_credit
  ON public.author_transactions(author_id, adjustment_ref)
  WHERE type = 'ADMIN_CREDIT' AND adjustment_ref IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_author_tx_admin_debit
  ON public.author_transactions(author_id, adjustment_ref)
  WHERE type = 'ADMIN_DEBIT' AND adjustment_ref IS NOT NULL;

-- 6. Add deterministic request identifier to author_withdrawals
ALTER TABLE public.author_withdrawals
  ADD COLUMN IF NOT EXISTS request_ref UUID NOT NULL;

ALTER TABLE public.author_withdrawals
  ADD CONSTRAINT uq_author_withdrawal_request_ref UNIQUE (author_id, request_ref);

CREATE INDEX IF NOT EXISTS idx_author_withdrawal_request_ref ON public.author_withdrawals(request_ref);
