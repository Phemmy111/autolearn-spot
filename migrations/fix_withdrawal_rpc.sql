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
        (cur_status = 'PENDING' AND p_new_status IN ('APPROVED','REJECTED','PAID')) OR
        (cur_status = 'APPROVED' AND p_new_status IN ('PROCESSING','REJECTED','PAID')) OR
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
