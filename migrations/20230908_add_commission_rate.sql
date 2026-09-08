-- Migration: Add commission_rate column with validation and enforce NGN currency

-- 1. Add commission_rate to learning_products (if not exists)
ALTER TABLE public.learning_products
    ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,4) NOT NULL DEFAULT 0.1000;

-- 2. Ensure commission_rate is between 0 and 1
ALTER TABLE public.learning_products
    ADD CONSTRAINT chk_commission_rate_range CHECK (commission_rate >= 0 AND commission_rate <= 1);

-- 3. Ensure currency is NGN only (check constraint) – only if column exists
ALTER TABLE public.learning_products
    ADD CONSTRAINT chk_currency_ngn CHECK (currency = 'NGN');

-- End of migration
