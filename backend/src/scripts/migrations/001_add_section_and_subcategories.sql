-- ============================================================================
-- Migration: 001_add_section_and_subcategories.sql
-- Purpose: Introduce 'section' (women/men) and data-driven 'sub_categories' table
-- Safety: 100% backward compatible. All existing products default to 'women'.
-- Instructions: Run manually in Supabase Dashboard -> SQL Editor -> New Query
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Add 'section' column to products table
-- Default 'women' ensures all existing products are automatically categorized as Women.
-- ----------------------------------------------------------------------------
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS section TEXT NOT NULL DEFAULT 'women'
CHECK (section IN ('women', 'men'));

-- ----------------------------------------------------------------------------
-- STEP 2: Create 'sub_categories' table
-- Stores data-driven subcategories for both Men and Women sections.
-- Unique constraint on (section, slug) prevents duplicate subcategories per section.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sub_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section     TEXT NOT NULL CHECK (section IN ('women', 'men')),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_sub_categories_section_slug UNIQUE (section, slug)
);

-- ----------------------------------------------------------------------------
-- STEP 3: Link products to sub_categories via foreign key
-- Nullable to preserve compatibility with existing text-based subcategory column.
-- ----------------------------------------------------------------------------
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES sub_categories(id) ON DELETE SET NULL;

-- ----------------------------------------------------------------------------
-- STEP 4: Create performance indexes
-- Speeds up section filtering, PLP subcategory queries, and foreign key joins.
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_section 
  ON products(section);

CREATE INDEX IF NOT EXISTS idx_products_subcategory_id 
  ON products(subcategory_id);

CREATE INDEX IF NOT EXISTS idx_products_section_subcategory 
  ON products(section, subcategory);

CREATE INDEX IF NOT EXISTS idx_sub_categories_section 
  ON sub_categories(section);

CREATE INDEX IF NOT EXISTS idx_sub_categories_slug 
  ON sub_categories(slug);

-- ----------------------------------------------------------------------------
-- STEP 5: Row Level Security (RLS) for sub_categories
-- Public read access so storefront can query categories; Service role write access.
-- ----------------------------------------------------------------------------

ALTER TABLE sub_categories ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sub_categories' AND policyname = 'Public read access - sub_categories'
  ) THEN
    CREATE POLICY "Public read access - sub_categories"
      ON sub_categories FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sub_categories' AND policyname = 'Service role full access - sub_categories'
  ) THEN
    CREATE POLICY "Service role full access - sub_categories"
      ON sub_categories FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- STEP 6: Seed initial subcategories
-- Seeds Men subcategories: Kurta Sets, Premium Cotton Plain, Premium Cotton Self Designed.
-- Seeds Women subcategories to preserve existing catalogue taxonomy.
-- ----------------------------------------------------------------------------
INSERT INTO sub_categories (section, name, slug)
VALUES
  -- Men Section
  ('men', 'Kurta Sets', 'kurta-sets'),
  ('men', 'Premium Cotton Plain', 'premium-cotton-plain'),
  ('men', 'Premium Cotton Self Designed', 'premium-cotton-self-designed'),

  -- Women Section (Existing subcategories for data-driven parity)
  ('women', 'Embroidered Satin with Dupatta', 'embroidered-satin-with-dupatta'),
  ('women', 'Luxury Cotton Satin', 'luxury-cotton-satin'),
  ('women', 'Satin Lucknowi Collection', 'satin-lucknowi-collection'),
  ('women', 'Rose Royale Collection', 'rose-royale-collection'),
  ('women', 'PURE COTTON SUITS', 'pure-cotton-suits')
ON CONFLICT (section, slug) DO NOTHING;

-- ----------------------------------------------------------------------------
-- STEP 7: Backfill subcategory_id for existing Women products
-- Matches products.subcategory text against sub_categories.name.
-- ----------------------------------------------------------------------------
UPDATE products p
SET subcategory_id = s.id
FROM sub_categories s
WHERE s.section = 'women'
  AND LOWER(TRIM(s.name)) = LOWER(TRIM(p.subcategory))
  AND p.subcategory_id IS NULL;

-- ============================================================================
-- VERIFICATION QUERY (Run this after applying migration to confirm success)
-- ============================================================================
/*
-- 1. Check sub_categories seed data:
SELECT section, name, slug, created_at FROM sub_categories ORDER BY section, created_at;

-- 2. Check products section distribution:
SELECT section, COUNT(*) as product_count FROM products GROUP BY section;

-- 3. Check matched subcategory_ids:
SELECT p.name, p.section, p.subcategory, s.name AS linked_sub_name
FROM products p
LEFT JOIN sub_categories s ON p.subcategory_id = s.id
LIMIT 10;
*/

-- ============================================================================
-- ROLLBACK SCRIPT (Run only if you need to completely revert this migration)
-- ============================================================================
/*
-- Revert STEP 7 & 3: Drop foreign key column
ALTER TABLE products DROP COLUMN IF EXISTS subcategory_id;

-- Revert STEP 4: Drop indexes
DROP INDEX IF EXISTS idx_products_section;
DROP INDEX IF EXISTS idx_products_subcategory_id;
DROP INDEX IF EXISTS idx_products_section_subcategory;
DROP INDEX IF EXISTS idx_sub_categories_section;
DROP INDEX IF EXISTS idx_sub_categories_slug;

-- Revert STEP 5 & 2: Drop table (policies dropped automatically with table)
DROP TABLE IF EXISTS sub_categories CASCADE;

-- Revert STEP 1: Drop section column
ALTER TABLE products DROP COLUMN IF EXISTS section;
*/
