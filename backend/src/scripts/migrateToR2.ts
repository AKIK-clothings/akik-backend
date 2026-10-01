/**
 * Zero-Downtime Migration: Supabase Storage → Cloudflare R2
 *
 * Strategy:
 *  1. Fetch all products from DB.
 *  2. For every image URL pointing to Supabase, download it.
 *  3. Upload to R2 under the same path key.
 *  4. Atomically update the DB row with the new R2 URL.
 *  5. Site stays fully live throughout — both providers serve valid URLs.
 *
 * Run: ts-node src/scripts/migrateToR2.ts
 */

import { createClient } from "@supabase/supabase-js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET, getR2PublicUrl } from "../config/r2";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const SUPABASE_STORAGE_BASE = `${process.env.SUPABASE_URL}/storage/v1/object/public/product-images/`;

/** Extract the R2 key from a Supabase public URL */
function extractKey(supabaseUrl: string): string | null {
  if (!supabaseUrl.includes("/storage/v1/object/public/product-images/")) return null;
  return supabaseUrl.split("/storage/v1/object/public/product-images/")[1];
}

/** Download a file from any public URL and return a Buffer */
async function downloadUrl(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

/** Upload buffer to R2 */
async function uploadToR2(key: string, buffer: Buffer, contentType = "image/webp"): Promise<void> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
}

/** Replace a Supabase URL with its R2 equivalent */
async function migrateUrl(
  url: string,
  migrated: Map<string, string>
): Promise<string> {
  if (!url || !url.includes("supabase.co")) return url;

  // Return cached result if already migrated
  if (migrated.has(url)) return migrated.get(url)!;

  const key = extractKey(url);
  if (!key) return url;

  try {
    const buffer = await downloadUrl(url);
    await uploadToR2(key, buffer);
    const r2Url = getR2PublicUrl(key);
    migrated.set(url, r2Url);
    console.log(`  ✅ Migrated: ${key}`);
    return r2Url;
  } catch (err) {
    console.error(`  ❌ Failed to migrate ${url}:`, err);
    return url; // keep original on failure — zero data loss
  }
}

async function run() {
  console.log("================================================");
  console.log("  AKIK: Supabase Storage → Cloudflare R2       ");
  console.log("================================================\n");

  // Fetch all products
  const { data: products, error } = await supabase.from("products").select("*");
  if (error) {
    console.error("❌ Failed to fetch products:", error);
    process.exit(1);
  }

  console.log(`Found ${products.length} products.\n`);

  // URL cache — avoid re-uploading same file twice
  const migrated = new Map<string, string>();
  let updatedCount = 0;

  for (const product of products) {
    console.log(`[${products.indexOf(product) + 1}/${products.length}] ${product.name}`);

    let changed = false;
    let primaryImage = product.primary_image || "";
    let secondaryImage = product.secondary_image || "";
    let galleryImages: string[] = Array.isArray(product.gallery_images) ? [...product.gallery_images] : [];
    let colorVariants: Array<Record<string, string>> = Array.isArray(product.color_variants)
      ? JSON.parse(JSON.stringify(product.color_variants))
      : [];

    // Migrate primary image
    if (primaryImage && primaryImage.includes("supabase.co")) {
      const newUrl = await migrateUrl(primaryImage, migrated);
      if (newUrl !== primaryImage) { primaryImage = newUrl; changed = true; }
    }

    // Migrate secondary image
    if (secondaryImage && secondaryImage.includes("supabase.co")) {
      const newUrl = await migrateUrl(secondaryImage, migrated);
      if (newUrl !== secondaryImage) { secondaryImage = newUrl; changed = true; }
    }

    // Migrate gallery images
    for (let i = 0; i < galleryImages.length; i++) {
      if (galleryImages[i]?.includes("supabase.co")) {
        const newUrl = await migrateUrl(galleryImages[i], migrated);
        if (newUrl !== galleryImages[i]) { galleryImages[i] = newUrl; changed = true; }
      }
    }

    // Migrate color variant images
    for (const cv of colorVariants) {
      if (cv.imageSrc?.includes("supabase.co")) {
        const newUrl = await migrateUrl(cv.imageSrc, migrated);
        if (newUrl !== cv.imageSrc) { cv.imageSrc = newUrl; changed = true; }
      }
      if (cv.secondaryImageSrc?.includes("supabase.co")) {
        const newUrl = await migrateUrl(cv.secondaryImageSrc, migrated);
        if (newUrl !== cv.secondaryImageSrc) { cv.secondaryImageSrc = newUrl; changed = true; }
      }
    }

    // Atomically update DB if anything changed
    if (changed) {
      const { error: updateError } = await supabase
        .from("products")
        .update({
          primary_image: primaryImage,
          secondary_image: secondaryImage,
          gallery_images: galleryImages,
          color_variants: colorVariants,
          updated_at: new Date().toISOString(),
        })
        .eq("id", product.id);

      if (updateError) {
        console.error(`  ❌ DB update failed for "${product.name}":`, updateError);
      } else {
        updatedCount++;
        console.log(`  📝 DB updated for "${product.name}"`);
      }
    } else {
      console.log(`  ⏭️  No Supabase images found — skipped`);
    }
  }

  console.log("\n================================================");
  console.log(`✅ Migration complete.`);
  console.log(`   Products updated: ${updatedCount}/${products.length}`);
  console.log(`   Unique files migrated: ${migrated.size}`);
  console.log("================================================\n");
  console.log("⚠️  Old Supabase images still exist — delete manually after verifying.");
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
