-- ============================================================
-- Migration 002: Add COD support indexes & constraints
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Note: orders.payment_method already exists (TEXT DEFAULT 'razorpay')
-- ============================================================

-- Add index on payment_method for fast admin queries
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);

-- Add index on payment_status for revenue calculation and admin filters
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- Optional comment documenting allowed payment_method values ('razorpay', 'cod')
COMMENT ON COLUMN orders.payment_method IS 'Payment method used: razorpay (online) or cod (cash on delivery)';
