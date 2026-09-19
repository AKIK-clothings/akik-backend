/**
 * AKIK Product Seed Script
 * Seeds all 31 products from the frontend mock catalogue into Supabase.
 * Run with: npm run seed
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

interface FrontendProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  subcategory: string;
  regularPrice: number;
  discountedPrice: number;
  isSoldOut: boolean;
  sizes: string[];
  sizeStockMap: Record<string, boolean>;
  colorVariants: Array<{
    name: string;
    hexCode: string;
    imageSrc: string;
    secondaryImageSrc?: string;
  }>;
  primaryImage: string;
  secondaryImage: string;
  galleryImages: string[];
  sku: string;
  rating: number;
  reviewCount: number;
  description: string;
  fabricDetails: string;
  dimensions?: string;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  accordions?: {
    fabricCare: string;
    stitchingDetails: string;
    shippingReturns: string;
  };
}

function loadProductsFromFrontend(): FrontendProduct[] {
  const filePath = path.resolve(__dirname, "../../../frontend/src/data/mockProducts.ts");
  if (!fs.existsSync(filePath)) {
    throw new Error(`mockProducts.ts not found at ${filePath}`);
  }
  const content = fs.readFileSync(filePath, "utf8");
  const match = content.match(/MOCK_PRODUCTS:\s*Product\[\]\s*=\s*(\[[\s\S]*?\]);\s*export const/);
  if (!match || !match[1]) {
    throw new Error("Could not parse MOCK_PRODUCTS from mockProducts.ts");
  }
  return JSON.parse(match[1]);
}

async function seed() {
  console.log("🌱 Starting AKIK product seed...\n");

  const rawProducts = loadProductsFromFrontend();
  console.log(`📦 Loaded ${rawProducts.length} products from frontend catalogue.\n`);

  let seeded = 0;
  let skipped = 0;
  let failed = 0;

  for (const p of rawProducts) {
    try {
      const dbProduct = {
        slug: p.slug,
        name: p.name,
        category: p.category,
        subcategory: p.subcategory,
        regular_price: p.regularPrice || p.discountedPrice,
        discounted_price: p.discountedPrice,
        is_sold_out: p.isSoldOut || false,
        sizes: p.sizes || [],
        size_stock_map: p.sizeStockMap || {},
        color_variants: p.colorVariants || [],
        primary_image: p.primaryImage || "",
        secondary_image: p.secondaryImage || "",
        gallery_images: p.galleryImages || [],
        sku: p.sku || `AKIK-${p.slug}`,
        rating: p.rating || 5.0,
        review_count: p.reviewCount || 0,
        description: p.description || "",
        fabric_details: p.fabricDetails || "",
        dimensions: p.dimensions || "",
        is_new_arrival: p.isNewArrival || false,
        is_best_seller: p.isBestSeller || false,
        is_featured: p.isFeatured || false,
        accordions: p.accordions || {},
        is_active: true,
      };

      // Check if product already exists by slug
      const { data: existing } = await supabase
        .from("products")
        .select("id, slug")
        .eq("slug", dbProduct.slug)
        .single();

      if (existing) {
        console.log(`⏭️  Skipped (already exists): ${dbProduct.slug}`);
        skipped++;
        continue;
      }

      const { error } = await supabase.from("products").insert(dbProduct);
      if (error) throw error;

      console.log(`✅ Seeded: ${dbProduct.name} (${dbProduct.slug})`);
      seeded++;
    } catch (err) {
      console.error(`❌ Failed: ${p.slug}`, err);
      failed++;
    }
  }

  console.log(`\n📊 Seed complete!`);
  console.log(`   ✅ Seeded: ${seeded}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed script error:", err);
  process.exit(1);
});
