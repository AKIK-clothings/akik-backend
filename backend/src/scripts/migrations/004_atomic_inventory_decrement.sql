-- ============================================================
-- Migration 004: Atomic Row-Locked Inventory Decrement
-- Run in Supabase Dashboard -> SQL Editor -> New Query
-- ============================================================

CREATE OR REPLACE FUNCTION decrement_product_inventory(
  p_product_id UUID,
  p_size TEXT,
  p_qty INT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_sm JSONB;
  v_is_sold_out BOOLEAN;
  v_size TEXT := COALESCE(TRIM(p_size), '');
  v_qty INT := GREATEST(1, COALESCE(p_qty, 1));
  v_changed BOOLEAN := false;
  v_cur INT;
  v_all_zero BOOLEAN;
BEGIN
  SELECT size_stock_map, is_sold_out
  INTO v_sm, v_is_sold_out
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_sm := COALESCE(v_sm, '{}'::jsonb);

  IF v_size <> '' AND jsonb_typeof(v_sm -> v_size) = 'number' THEN
    v_cur := GREATEST(0, ((v_sm ->> v_size)::INT) - v_qty);
    v_sm := jsonb_set(v_sm, ARRAY[v_size], to_jsonb(v_cur));
    v_changed := true;
  END IF;

  IF jsonb_typeof(v_sm -> 'total') = 'number' THEN
    v_cur := GREATEST(0, ((v_sm ->> 'total')::INT) - v_qty);
    v_sm := jsonb_set(v_sm, ARRAY['total'], to_jsonb(v_cur));
    v_changed := true;
  END IF;

  IF v_changed THEN
    IF jsonb_typeof(v_sm -> 'total') = 'number' AND ((v_sm ->> 'total')::INT) <= 0 THEN
      v_is_sold_out := true;
    ELSE
      SELECT COALESCE(bool_and((value::TEXT)::INT <= 0), false)
      INTO v_all_zero
      FROM jsonb_each(v_sm)
      WHERE key <> 'total' AND jsonb_typeof(value) = 'number';

      IF EXISTS (
        SELECT 1 FROM jsonb_each(v_sm)
        WHERE key <> 'total' AND jsonb_typeof(value) = 'number'
      ) AND v_all_zero THEN
        v_is_sold_out := true;
      END IF;
    END IF;

    UPDATE products
    SET size_stock_map = v_sm,
        is_sold_out = v_is_sold_out,
        updated_at = NOW()
    WHERE id = p_product_id;
  END IF;
END;
$$;
