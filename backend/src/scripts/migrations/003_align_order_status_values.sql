-- ============================================================
-- Migration 003: Align orders.status with Admin dropdown + /track-order milestones
-- Run this in: Supabase Dashboard → SQL Editor → New Query
--
-- Milestones (customer /track-order)  →  DB value
--   Order Placed                       →  'new'
--   Confirmed                          →  'confirmed'
--   In Tailoring                       →  'tailoring'   (NEW — previously rejected by constraint)
--   Dispatched                         →  'dispatched'
--   Delivered                          →  'delivered'
--   Cancelled                          →  'cancelled'
--
-- Fixes: Admin Orders "Failed to update status" (orders_status_check violation
-- when admin selected 'processing' / 'tailoring').
-- Also back-fills payment_status='paid' for already-delivered pending (COD) orders.
-- ============================================================

BEGIN;

-- 1. Drop the old inline CHECK constraint (Postgres auto-names it orders_status_check)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- 2. Normalise any legacy values
UPDATE orders SET status = 'tailoring' WHERE status = 'processing';

-- 3. Re-create the constraint with the aligned value set
ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('new', 'confirmed', 'tailoring', 'dispatched', 'delivered', 'cancelled'));

-- 4. Delivered orders must not show "Payment: Pending" (COD collected on delivery)
UPDATE orders
   SET payment_status = 'paid', updated_at = now()
 WHERE status = 'delivered' AND payment_status = 'pending';

COMMIT;

-- Verify:
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
--  WHERE conrelid = 'orders'::regclass AND contype = 'c';

