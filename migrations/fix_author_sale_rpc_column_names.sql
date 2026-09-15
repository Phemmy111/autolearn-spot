-- Fix the record_author_sale RPC function to use correct column names
-- The order_items table uses learning_product_id, not product_id

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
    JOIN public.learning_products AS lp ON lp.id = oi.learning_product_id
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
        (SELECT learning_product_id FROM public.order_items WHERE id = p_order_item_id),
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
