# Men Section Migration & Deployment Runbook

**Branch:** `feat/men-section`  
**Target:** Production (Supabase DB + Render Backend + Vercel Frontend)  
**Safety:** 100% additive, backward compatible with Women collection.

---

## 1. Pre-Flight Checklist

- [ ] Confirm active git branch is `feat/men-section`.
- [ ] Confirm local TypeScript validation passes:
  - Backend: `cd backend && npx tsc --noEmit` (exit 0)
  - Frontend: `cd frontend && npx tsc --noEmit` (exit 0)
- [ ] Confirm Supabase dashboard access (SQL Editor privileges).
- [ ] Confirm Render dashboard access for backend service.
- [ ] Confirm Vercel dashboard access for frontend project.

---

## 2. Step 1: Database Migration (Supabase)

> [!IMPORTANT]
> Execute during low-traffic window. The migration is idempotent and non-blocking.

1. Open **Supabase Dashboard** > **SQL Editor**.
2. Open [`backend/src/scripts/migrations/001_add_section_and_subcategories.sql`](file:///c:/Users/VICTUS/Desktop/AKIK_web/backend/src/scripts/migrations/001_add_section_and_subcategories.sql).
3. Copy & execute the entire script.
4. **Verification Queries** (run in SQL Editor):

```sql
-- 1. Verify schema columns
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name IN ('section', 'subcategory_id');

-- 2. Verify sub_categories table exists & RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'sub_categories';

-- 3. Verify seed data
SELECT section, name, slug FROM sub_categories ORDER BY section, name;

-- 4. Verify existing products backfilled to 'women'
SELECT count(*) AS unmigrated_count FROM products WHERE section IS NULL;
-- Expected result: 0
```

---

## 3. Step 2: Backend Deployment (Render)

1. Review changes:
   - Route [`backend/src/routes/subcategories.ts`](file:///c:/Users/VICTUS/Desktop/AKIK_web/backend/src/routes/subcategories.ts)
   - Route [`backend/src/routes/admin/subcategories.ts`](file:///c:/Users/VICTUS/Desktop/AKIK_web/backend/src/routes/admin/subcategories.ts)
   - Updated [`backend/src/routes/products.ts`](file:///c:/Users/VICTUS/Desktop/AKIK_web/backend/src/routes/products.ts)
   - Updated [`backend/src/routes/admin/products.ts`](file:///c:/Users/VICTUS/Desktop/AKIK_web/backend/src/routes/admin/products.ts)
   - Updated [`backend/src/middleware/validate.ts`](file:///c:/Users/VICTUS/Desktop/AKIK_web/backend/src/middleware/validate.ts)
2. Push branch or merge PR to deployment branch (e.g., `main`).
3. Render automatic build triggers, or trigger manual deploy:
   - Build Command: `npm run build`
   - Start Command: `npm start`
4. **Smoke test backend endpoints via cURL / Postman**:
   ```bash
   # 1. Health check
   curl -I https://<render-backend-url>/health

   # 2. Public subcategories
   curl -s https://<render-backend-url>/api/subcategories?section=men

   # 3. Public products (Women backward compat test)
   curl -s "https://<render-backend-url>/api/products?section=women"

   # 4. Public products (Men section test)
   curl -s "https://<render-backend-url>/api/products?section=men"
   ```

---

## 4. Step 3: Frontend Deployment (Vercel)

1. Push branch to GitHub; Vercel generates Preview Deployment.
2. Open Vercel Preview URL and run smoke test checklist (Section 5).
3. If all checks pass, merge PR to production branch (`main`).
4. Vercel automatically deploys production bundle.

---

## 5. Step 4: Smoke Test Checklist

### A. Women Collection (Zero Regression)
- [ ] `/collections` loads existing Women products unchanged.
- [ ] `/collections?collection=stitched` displays stitched items with size filters.
- [ ] `/collections?collection=unstitched` displays unstitched items with color & price filters.
- [ ] `/collections?collection=kids` displays kids items correctly.
- [ ] Women PDP (`/product/[slug]`) displays size selectors (XS, S, M, L, XL), accordion tabs, stock map, and add-to-bag.
- [ ] Cart and Checkout flows remain untouched and functional.

### B. Admin Panel
- [ ] `/admin/products` loads with Section tabs: **All**, **Women**, **Men**.
- [ ] Existing Women products show `Women` badge and can be edited without altering section.
- [ ] `/admin/products/new`:
  - Toggle section to **Men**.
  - Category automatically sets to **Kurta Sets** (read-only for Men launch).
  - Subcategory dropdown populates with: *Premium Cotton Plain*, *Premium cotton self designed*.
  - Click **"+ Create New Sub-category"**, enter a custom subcategory (e.g. *Festive Jacquard*), save.
  - Custom subcategory appears selected immediately.
  - Size checklist hides; single unstitched stock counter appears.
  - Save product. Product saves with `section = 'men'`.
- [ ] Edit product (`/admin/products/[id]/edit`) loads correctly, preserves Men attributes, and saves updates.

### C. Men Storefront
- [ ] Navigation header and mobile menu show **Men** category link with "New" badge.
- [ ] `/men` loads Men's collection page with:
  - Hero banner with unstitched Kurta Sets tagline.
  - Dynamic subcategory filter pills (*All Kurta Sets*, *Premium Cotton Plain*, *Premium cotton self designed*, and any admin-created subcategories).
  - Sorting (Price Low-High, Price High-Low, Newest).
  - Size filter is omitted (unstitched product).
  - Empty state with WhatsApp enquiry CTA renders gracefully if no products yet active.
- [ ] `/men/kurta-sets` loads dedicated Kurta Sets route with full filtering.
- [ ] Men PDP (`/product/[slug]`):
  - Breadcrumb displays: `Home > Men > Kurta Sets > [Product Name]`.
  - Size selector replaced by **Unstitched Kurta Set Fabric** guarantee badge & sizing guidance.
  - Gallery, color swatches, price, accordion details work seamlessly.

---

## 6. Step 5: Rollback Plan

If unexpected issues occur in production, follow this order:

### 1. Frontend Rollback (Vercel)
- Go to **Vercel Dashboard** > **Deployments**.
- Find previous stable deployment prior to Men section merge.
- Click **"Instant Rollback"** or redeploy previous production build (< 1 minute).

### 2. Backend Rollback (Render)
- Go to **Render Dashboard** > **backend service** > **Deploys**.
- Roll back to previous commit / deploy (< 2 minutes).

### 3. Database Rollback (Supabase)
> [!CAUTION]
> Only execute if DDL changes need to be reverted. Note: The schema changes are purely additive with defaults; reverting SQL is typically unnecessary unless dropping the feature completely.

Run in **Supabase SQL Editor**:

```sql
-- ROLLBACK SCRIPT

-- 1. Drop trigger and function
DROP TRIGGER IF EXISTS trg_set_product_subcategory_id ON products;
DROP FUNCTION IF EXISTS fn_sync_product_subcategory_id();

-- 2. Drop RLS policies
DROP POLICY IF EXISTS "Public read access - sub_categories" ON sub_categories;
DROP POLICY IF EXISTS "Service role full access - sub_categories" ON sub_categories;

-- 3. Drop foreign key constraint & columns from products
ALTER TABLE products DROP CONSTRAINT IF EXISTS fk_products_sub_category;
ALTER TABLE products DROP COLUMN IF EXISTS subcategory_id;
ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_products_section;
ALTER TABLE products DROP COLUMN IF EXISTS section;

-- 4. Drop sub_categories table
DROP TABLE IF EXISTS sub_categories CASCADE;
```
