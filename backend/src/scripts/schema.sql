-- ============================================================
-- AKIK by Hafsa Khatri — Supabase PostgreSQL Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ─── Enable UUID extension ───────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── PRODUCTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT UNIQUE NOT NULL,
  name              TEXT NOT NULL,
  category          TEXT NOT NULL,
  subcategory       TEXT,
  regular_price     INTEGER NOT NULL DEFAULT 0,
  discounted_price  INTEGER NOT NULL,
  is_sold_out       BOOLEAN DEFAULT false,
  sizes             TEXT[] DEFAULT '{}',
  size_stock_map    JSONB DEFAULT '{}',
  color_variants    JSONB DEFAULT '[]',
  primary_image     TEXT DEFAULT '',
  secondary_image   TEXT DEFAULT '',
  gallery_images    TEXT[] DEFAULT '{}',
  sku               TEXT UNIQUE,
  rating            DECIMAL(2,1) DEFAULT 5.0,
  review_count      INTEGER DEFAULT 0,
  description       TEXT DEFAULT '',
  fabric_details    TEXT DEFAULT '',
  dimensions        TEXT,
  is_new_arrival    BOOLEAN DEFAULT false,
  is_best_seller    BOOLEAN DEFAULT false,
  is_featured       BOOLEAN DEFAULT false,
  accordions        JSONB DEFAULT '{}',
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ─── ORDERS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number          TEXT UNIQUE NOT NULL,
  customer_name         TEXT NOT NULL,
  customer_phone        TEXT NOT NULL,
  customer_email        TEXT,
  address_line1         TEXT NOT NULL,
  address_line2         TEXT,
  city                  TEXT NOT NULL,
  state                 TEXT NOT NULL,
  pin_code              TEXT NOT NULL,
  delivery_notes        TEXT,
  subtotal              INTEGER NOT NULL,
  coupon_discount       INTEGER DEFAULT 0,
  shipping_fee          INTEGER DEFAULT 0,
  final_total           INTEGER NOT NULL,
  promo_code            TEXT,
  payment_method        TEXT DEFAULT 'razorpay',
  razorpay_order_id     TEXT UNIQUE,
  razorpay_payment_id   TEXT,
  payment_status        TEXT DEFAULT 'pending'
                        CHECK (payment_status IN ('pending','paid','failed','refunded')),
  status                TEXT DEFAULT 'new'
                        CHECK (status IN ('new','confirmed','dispatched','delivered','cancelled')),
  whatsapp_notified     BOOLEAN DEFAULT false,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- ─── ORDER ITEMS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name    TEXT NOT NULL,
  selected_color  JSONB NOT NULL DEFAULT '{}',
  selected_size   TEXT NOT NULL,
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  unit_price      INTEGER NOT NULL,
  line_total      INTEGER NOT NULL
);

-- ─── PROMO CODES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promo_codes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                TEXT UNIQUE NOT NULL,
  discount_percentage INTEGER NOT NULL CHECK (discount_percentage BETWEEN 1 AND 100),
  description         TEXT,
  min_order_value     INTEGER DEFAULT 0,
  is_active           BOOLEAN DEFAULT true,
  usage_limit         INTEGER,
  usage_count         INTEGER DEFAULT 0,
  expires_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- ─── ENQUIRIES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enquiries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  phone       TEXT,
  topic       TEXT,
  message     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── ADMINS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT,
  role          TEXT DEFAULT 'admin',
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ─── INDEXES (for faster queries) ────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_enquiries_is_read ON enquiries(is_read);

-- ─── ATOMIC ORDER NUMBER SEQUENCE (SEC-02) ───────────────────
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1;

CREATE OR REPLACE FUNCTION generate_next_order_number()
RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  RETURN 'AKIK-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
END;
$$;

-- ─── HELPER FUNCTION: Atomic Promo Validation & Usage (SEC-09) ─
CREATE OR REPLACE FUNCTION apply_promo_atomic(p_code TEXT, p_subtotal INT)
RETURNS TABLE (
  success BOOLEAN,
  discount_percentage INT,
  message TEXT
) LANGUAGE plpgsql AS $$
DECLARE
  v_promo RECORD;
BEGIN
  SELECT * INTO v_promo
  FROM promo_codes
  WHERE code = UPPER(TRIM(p_code)) AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 'Invalid or inactive promo code';
    RETURN;
  END IF;

  IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at < NOW() THEN
    RETURN QUERY SELECT false, 0, 'This promo code has expired';
    RETURN;
  END IF;

  IF v_promo.usage_limit IS NOT NULL AND v_promo.usage_count >= v_promo.usage_limit THEN
    RETURN QUERY SELECT false, 0, 'Promo code usage limit reached';
    RETURN;
  END IF;

  IF v_promo.min_order_value IS NOT NULL AND p_subtotal < v_promo.min_order_value THEN
    RETURN QUERY SELECT false, 0, 'Subtotal below minimum required order value';
    RETURN;
  END IF;

  UPDATE promo_codes
  SET usage_count = usage_count + 1
  WHERE id = v_promo.id;

  RETURN QUERY SELECT true, v_promo.discount_percentage, 'Promo applied successfully';
END;
$$;

-- ─── HELPER FUNCTION: Increment promo usage ──────────────────
CREATE OR REPLACE FUNCTION increment_promo_usage(promo_code TEXT)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE promo_codes
  SET usage_count = usage_count + 1
  WHERE code = promo_code;
END;
$$;

-- ─── ROW LEVEL SECURITY (optional but recommended) ───────────
-- Products: public read, admin write (handled by service role key in backend)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (used by backend)
CREATE POLICY "Service role full access - products"
  ON products FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access - orders"
  ON orders FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access - order_items"
  ON order_items FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access - promo_codes"
  ON promo_codes FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access - enquiries"
  ON enquiries FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access - admins"
  ON admins FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── SEED: Default promo codes ───────────────────────────────
INSERT INTO promo_codes (code, discount_percentage, description, min_order_value, is_active)
VALUES
  ('FESTIVE15', 15, '15% off festive celebration discount', 2500, true),
  ('AKIKWELCOME', 10, '10% off your first boutique purchase', 1500, true)
ON CONFLICT (code) DO NOTHING;

-- ─── SUPABASE STORAGE BUCKET ─────────────────────────────────
-- Run this separately in Supabase Dashboard → Storage → Create new bucket
-- Bucket name: product-images
-- Public bucket: YES (so image URLs work publicly)
-- NOTE: This SQL creates the bucket programmatically:
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;
