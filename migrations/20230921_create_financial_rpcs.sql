-- Migration: Create RPC functions for atomic financial core

-- 1. Function to compute available balance for an author
CREATE OR REPLACE FUNCTION public.available_balance(p_author_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    bal numeric;
BEGIN
    SELECT COALESCE(SUM(
        CASE
            WHEN type IN ('SALE_CREDIT', 'ADMIN_CREDIT') THEN amount
            WHEN type IN ('REFUND_DEBIT', 'WITHDRAWAL_DEBIT', 'ADMIN_DEBIT') THEN -amount
            ELSE 0
        END
    ), 0) INTO bal
    FROM public.author_transactions
    WHERE author_id = p_author_id;
    RETURN bal;
END;
$$;

GRANT EXECUTE ON FUNCTION public.available_balance(uuid) TO service_role;

-- 2. Record author sale (idempotent)
CREATE OR REPLACE FUNCTION public.record_author_sale(p_order_id uuid, p_order_item_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    order_status text;
    product_id uuid;
    author_id uuid;
    gross numeric;
    commission_rate numeric;
    commission numeric;
    net numeric;
    sale_id uuid;
BEGIN
    -- Verify order is paid
    SELECT status INTO order_status FROM public.orders WHERE id = p_order_id;
    IF order_status IS NULL OR order_status <> 'PAID' THEN
        RAISE EXCEPTION 'Order % is not paid', p_order_id;
    END IF;

    -- Get order item price_snapshot and product info
    SELECT oi.price_snapshot, lp.author_id, lp.commission_rate
    INTO gross, author_id, commission_rate
    FROM public.order_items AS oi
    JOIN public.learning_products AS lp ON lp.id = oi.product_id
    WHERE oi.id = p_order_item_id;
    IF author_id IS NULL THEN
        RAISE EXCEPTION 'No author for product linked to order_item %', p_order_item_id;
    END IF;

    commission := gross * COALESCE(commission_rate, 0.1);
    net := gross - commission;

    -- Insert author_sales idempotently (unique on order_item_id)
    INSERT INTO public.author_sales (
        order_id,
        order_item_id,
        product_id,
        author_id,
        gross_amount,
        commission_amount,
        net_amount,
        currency
    ) VALUES (
        p_order_id,
        p_order_item_id,
        (SELECT product_id FROM public.order_items WHERE id = p_order_item_id),
        author_id,
        gross,
        commission,
        net,
        'NGN'
    ) ON CONFLICT (order_item_id) DO UPDATE SET updated_at = now()
    RETURNING id INTO sale_id;

    -- Insert SALE_CREDIT transaction (idempotent via unique index on author_id + related_id)
    INSERT INTO public.author_transactions (
        author_id,
        type,
        amount,
        currency,
        related_id,
        description
    ) VALUES (
        author_id,
        'SALE_CREDIT',
        net,
        'NGN',
        sale_id,
        format('Sale credit for order %s, item %s', p_order_id, p_order_item_id)
    ) ON CONFLICT ON CONSTRAINT idx_author_tx_sale_credit DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_author_sale(uuid, uuid) TO service_role;

-- 3. Handle refund (full refund, idempotent)
CREATE OR REPLACE FUNCTION public.handle_refund(p_order_item_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sale_rec RECORD;
    existing_tx integer;
BEGIN
    SELECT id, author_id INTO sale_rec FROM public.author_sales WHERE order_item_id = p_order_item_id;
    IF sale_rec.id IS NULL THEN
        RAISE EXCEPTION 'No sale found for order_item %', p_order_item_id;
    END IF;

    -- Check if REFUND_DEBIT already exists for this sale
    SELECT 1 INTO existing_tx FROM public.author_transactions
    WHERE type = 'REFUND_DEBIT' AND related_id = sale_rec.id LIMIT 1;
    IF existing_tx IS NOT NULL THEN
        RETURN; -- idempotent, already refunded
    END IF;

    INSERT INTO public.author_transactions (
        author_id,
        type,
        amount,
        currency,
        related_id,
        description
    ) VALUES (
        sale_rec.author_id,
        'REFUND_DEBIT',
        (SELECT net_amount FROM public.author_sales WHERE id = sale_rec.id),
        'NGN',
        sale_rec.id,
        format('Refund for order item %s', p_order_item_id)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.handle_refund(uuid) TO service_role;

-- 4. Request withdrawal (idempotent via request_ref)
CREATE OR REPLACE FUNCTION public.request_withdrawal(p_author_id uuid, p_amount numeric, p_request_ref uuid)
RETURNS uuid -- returns the withdrawal id
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    bal numeric;
    existing_id uuid;
    withdrawal_id uuid;
BEGIN
    -- Ensure amount is positive
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Withdrawal amount must be positive';
    END IF;

    -- Idempotency: if a withdrawal with same request_ref exists, return it
    SELECT id INTO existing_id FROM public.author_withdrawals
    WHERE author_id = p_author_id AND request_ref = p_request_ref;
    IF existing_id IS NOT NULL THEN
        RETURN existing_id;
    END IF;

    -- Lock author row to prevent race conditions
    PERFORM 1 FROM public.authors WHERE id = p_author_id FOR UPDATE;

    bal := public.available_balance(p_author_id);
    IF bal < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance: % available, % requested', bal, p_amount;
    END IF;

    INSERT INTO public.author_withdrawals (
        author_id,
        amount,
        currency,
        status,
        provider,
        request_ref
    ) VALUES (
        p_author_id,
        p_amount,
        'NGN',
        'PENDING',
        'PAYSTACK',
        p_request_ref
    ) RETURNING id INTO withdrawal_id;

    INSERT INTO public.author_transactions (
        author_id,
        type,
        amount,
        currency,
        related_id,
        description
    ) VALUES (
        p_author_id,
        'WITHDRAWAL_DEBIT',
        p_amount,
        'NGN',
        withdrawal_id,
        format('Withdrawal request %s', p_request_ref)
    );

    RETURN withdrawal_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_withdrawal(uuid, numeric, uuid) TO service_role;

-- 5. Process withdrawal state transitions
CREATE OR REPLACE FUNCTION public.process_withdrawal(p_withdrawal_id uuid, p_new_status text, p_provider_ref text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cur_status text;
    author_id uuid;
    amount numeric;
    rev_exists integer;
BEGIN
    SELECT status, author_id, amount INTO cur_status, author_id, amount FROM public.author_withdrawals WHERE id = p_withdrawal_id;
    IF cur_status IS NULL THEN
        RAISE EXCEPTION 'Withdrawal % not found', p_withdrawal_id;
    END IF;

    -- Validate transition
    IF NOT (
        (cur_status = 'PENDING' AND p_new_status IN ('APPROVED','REJECTED')) OR
        (cur_status = 'APPROVED' AND p_new_status IN ('PROCESSING','REJECTED')) OR
        (cur_status = 'PROCESSING' AND p_new_status IN ('PAID','FAILED'))
    ) THEN
        RAISE EXCEPTION 'Invalid state transition from % to %', cur_status, p_new_status;
    END IF;

    UPDATE public.author_withdrawals SET status = p_new_status,
        provider_reference = p_provider_ref,
        updated_at = now()
    WHERE id = p_withdrawal_id;

    -- On rejection or failure, insert reversal if not already present
    IF p_new_status IN ('REJECTED','FAILED') THEN
        SELECT 1 INTO rev_exists FROM public.author_transactions
        WHERE type = 'WITHDRAWAL_REVERSAL' AND related_id = p_withdrawal_id LIMIT 1;
        IF rev_exists IS NULL THEN
            INSERT INTO public.author_transactions (
                author_id,
                type,
                amount,
                currency,
                related_id,
                description
            ) VALUES (
                author_id,
                'WITHDRAWAL_REVERSAL',
                amount,
                'NGN',
                p_withdrawal_id,
                format('Withdrawal reversal for %s', p_withdrawal_id)
            );
        END IF;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_withdrawal(uuid, text, text) TO service_role;
