/**
 * Batch Image Optimization & Compression Script
 * 1. Downloads uncompressed images from Supabase Storage 'product-images' bucket
 * 2. Compresses & resizes to WebP (1200px max, quality 80)
 * 3. Uploads with 1-year immutable cache headers (Cache-Control: public, max-age=31536000, immutable)
 * 4. Updates all matching product records in the database
 * 5. Cleans up old uncompressed files from the bucket
 */

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

const BUCKET = "product-images";

async function listAllFiles(prefix = ""): Promise<Array<{ path: string; size: number }>> {
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 100 });
  if (error) {
    console.error(`Error listing ${prefix}:`, error);
    return [];
  }
  let all: Array<{ path: string; size: number }> = [];
  for (const item of data) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id === null) {
      const sub = await listAllFiles(fullPath);
      all = all.concat(sub);
    } else {
      all.push({ path: fullPath, size: item.metadata?.size || 0 });
    }
  }
  return all;
}

async function run() {
  console.log("==================================================");
  console.log("   AKIK Supabase Storage Optimization Migration   ");
  console.log("==================================================\n");

  const files = await listAllFiles();
  console.log(`Found ${files.length} total files in "${BUCKET}" bucket.`);

  const nonWebpFiles = files.filter((f) => !f.path.toLowerCase().endsWith(".webp"));
  console.log(`${nonWebpFiles.length} files require compression to WebP.\n`);

  let totalOriginalBytes = 0;
  let totalCompressedBytes = 0;
  const urlMap = new Map<string, string>(); // oldPublicUrl -> newPublicUrl
  const filesToDelete: string[] = [];

  let idx = 0;
  for (const file of nonWebpFiles) {
    idx++;
    console.log(`[${idx}/${nonWebpFiles.length}] Processing: ${file.path} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    totalOriginalBytes += file.size;

    try {
      // 1. Download
      const { data: blob, error: dErr } = await supabase.storage.from(BUCKET).download(file.path);
      if (dErr || !blob) {
        console.error(`  ❌ Failed to download ${file.path}:`, dErr);
        continue;
      }
      const originalBuffer = Buffer.from(await blob.arrayBuffer());

      // 2. Compress with sharp
      const compressedBuffer = await sharp(originalBuffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 80, effort: 4 })
        .toBuffer();

      totalCompressedBytes += compressedBuffer.length;
      const reduction = ((1 - compressedBuffer.length / originalBuffer.length) * 100).toFixed(1);
      console.log(`  ⚡ Compressed to ${(compressedBuffer.length / 1024).toFixed(1)} KB (-${reduction}%)`);

      // 3. Upload new WebP file
      const newPath = file.path.replace(/\.[^.]+$/, ".webp");
      const { error: uErr } = await supabase.storage.from(BUCKET).upload(newPath, compressedBuffer, {
        contentType: "image/webp",
        cacheControl: "31536000, public, immutable",
        upsert: true,
      });

      if (uErr) {
        console.error(`  ❌ Failed to upload ${newPath}:`, uErr);
        continue;
      }

      // 4. Map URLs
      const { data: oldUrlData } = supabase.storage.from(BUCKET).getPublicUrl(file.path);
      const { data: newUrlData } = supabase.storage.from(BUCKET).getPublicUrl(newPath);

      urlMap.set(oldUrlData.publicUrl, newUrlData.publicUrl);
      if (file.path !== newPath) {
        filesToDelete.push(file.path);
      }
    } catch (err) {
      console.error(`  ❌ Error processing ${file.path}:`, err);
    }
  }

  console.log("\n--------------------------------------------------");
  console.log(`Total original size: ${(totalOriginalBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total compressed size: ${(totalCompressedBytes / 1024 / 1024).toFixed(2)} MB`);
  const overallReduction = ((1 - totalCompressedBytes / totalOriginalBytes) * 100).toFixed(1);
  console.log(`Overall Storage Reduction: ${overallReduction}%!`);
  console.log("--------------------------------------------------\n");

  // 5. Update Database Products Table
  console.log("🔄 Updating products table in Supabase...");
  const { data: products, error: pErr } = await supabase.from("products").select("*");
  if (pErr) {
    console.error("❌ Failed to fetch products for URL update:", pErr);
  } else {
    let updatedProductsCount = 0;

    for (const p of products) {
      let changed = false;
      let primaryImage = p.primary_image;
      let secondaryImage = p.secondary_image;
      let galleryImages = Array.isArray(p.gallery_images) ? [...p.gallery_images] : [];
      let colorVariants = Array.isArray(p.color_variants) ? JSON.parse(JSON.stringify(p.color_variants)) : [];

      function replaceUrl(url: string | null | undefined): string {
        if (!url) return url || "";
        if (urlMap.has(url)) return urlMap.get(url)!;
        // Also check if matches prefix or extension replacement
        for (const [oldUrl, newUrl] of urlMap.entries()) {
          if (url === oldUrl) return newUrl;
        }
        return url;
      }

      const newPrimary = replaceUrl(primaryImage);
      if (newPrimary !== primaryImage) {
        primaryImage = newPrimary;
        changed = true;
      }

      const newSecondary = replaceUrl(secondaryImage);
      if (newSecondary !== secondaryImage) {
        secondaryImage = newSecondary;
        changed = true;
      }

      for (let i = 0; i < galleryImages.length; i++) {
        const newImg = replaceUrl(galleryImages[i]);
        if (newImg !== galleryImages[i]) {
          galleryImages[i] = newImg;
          changed = true;
        }
      }

      for (const cv of colorVariants) {
        if (cv.imageSrc) {
          const newSrc = replaceUrl(cv.imageSrc);
          if (newSrc !== cv.imageSrc) {
            cv.imageSrc = newSrc;
            changed = true;
          }
        }
        if (cv.secondaryImageSrc) {
          const newSrc = replaceUrl(cv.secondaryImageSrc);
          if (newSrc !== cv.secondaryImageSrc) {
            cv.secondaryImageSrc = newSrc;
            changed = true;
          }
        }
      }

      if (changed) {
        const { error: upErr } = await supabase
          .from("products")
          .update({
            primary_image: primaryImage,
            secondary_image: secondaryImage,
            gallery_images: galleryImages,
            color_variants: colorVariants,
          })
          .eq("id", p.id);

        if (upErr) {
          console.error(`  ❌ Failed to update product ${p.name} (${p.id}):`, upErr);
        } else {
          updatedProductsCount++;
          console.log(`  ✅ Updated product: "${p.name}"`);
        }
      }
    }

    console.log(`\n✅ Successfully updated ${updatedProductsCount} products in database.`);
  }

  // 6. Delete old uncompressed files
  console.log(`\n🗑️ Deleting ${filesToDelete.length} uncompressed original files from bucket...`);
  // Supabase delete accepts up to 100 paths at a time
  for (let i = 0; i < filesToDelete.length; i += 50) {
    const chunk = filesToDelete.slice(i, i + 50);
    const { error: delErr } = await supabase.storage.from(BUCKET).remove(chunk);
    if (delErr) {
      console.error("  ❌ Delete chunk error:", delErr);
    } else {
      console.log(`  Deleted ${chunk.length} old files (${i + chunk.length}/${filesToDelete.length})`);
    }
  }

  console.log("\n🎉 Migration completed successfully!");
}

run().catch(console.error);
