"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const client_s3_1 = require("@aws-sdk/client-s3");
const r2_1 = require("../config/r2");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, "../../.env") });
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const SUPABASE_STORAGE_BASE = `${process.env.SUPABASE_URL}/storage/v1/object/public/product-images/`;
/** Extract the R2 key from a Supabase public URL */
function extractKey(supabaseUrl) {
    if (!supabaseUrl.includes("/storage/v1/object/public/product-images/"))
        return null;
    return supabaseUrl.split("/storage/v1/object/public/product-images/")[1];
}
/** Download a file from any public URL and return a Buffer */
async function downloadUrl(url) {
    const res = await fetch(url);
    if (!res.ok)
        throw new Error(`HTTP ${res.status} downloading ${url}`);
    return Buffer.from(await res.arrayBuffer());
}
/** Upload buffer to R2 */
async function uploadToR2(key, buffer, contentType = "image/webp") {
    await r2_1.r2Client.send(new client_s3_1.PutObjectCommand({
        Bucket: r2_1.R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
    }));
}
/** Replace a Supabase URL with its R2 equivalent */
async function migrateUrl(url, migrated) {
    if (!url || !url.includes("supabase.co"))
        return url;
    // Return cached result if already migrated
    if (migrated.has(url))
        return migrated.get(url);
    const key = extractKey(url);
    if (!key)
        return url;
    try {
        const buffer = await downloadUrl(url);
        await uploadToR2(key, buffer);
        const r2Url = (0, r2_1.getR2PublicUrl)(key);
        migrated.set(url, r2Url);
        console.log(`  ✅ Migrated: ${key}`);
        return r2Url;
    }
    catch (err) {
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
    const migrated = new Map();
    let updatedCount = 0;
    for (const product of products) {
        console.log(`[${products.indexOf(product) + 1}/${products.length}] ${product.name}`);
        let changed = false;
        let primaryImage = product.primary_image || "";
        let secondaryImage = product.secondary_image || "";
        let galleryImages = Array.isArray(product.gallery_images) ? [...product.gallery_images] : [];
        let colorVariants = Array.isArray(product.color_variants)
            ? JSON.parse(JSON.stringify(product.color_variants))
            : [];
        // Migrate primary image
        if (primaryImage && primaryImage.includes("supabase.co")) {
            const newUrl = await migrateUrl(primaryImage, migrated);
            if (newUrl !== primaryImage) {
                primaryImage = newUrl;
                changed = true;
            }
        }
        // Migrate secondary image
        if (secondaryImage && secondaryImage.includes("supabase.co")) {
            const newUrl = await migrateUrl(secondaryImage, migrated);
            if (newUrl !== secondaryImage) {
                secondaryImage = newUrl;
                changed = true;
            }
        }
        // Migrate gallery images
        for (let i = 0; i < galleryImages.length; i++) {
            if (galleryImages[i]?.includes("supabase.co")) {
                const newUrl = await migrateUrl(galleryImages[i], migrated);
                if (newUrl !== galleryImages[i]) {
                    galleryImages[i] = newUrl;
                    changed = true;
                }
            }
        }
        // Migrate color variant images
        for (const cv of colorVariants) {
            if (cv.imageSrc?.includes("supabase.co")) {
                const newUrl = await migrateUrl(cv.imageSrc, migrated);
                if (newUrl !== cv.imageSrc) {
                    cv.imageSrc = newUrl;
                    changed = true;
                }
            }
            if (cv.secondaryImageSrc?.includes("supabase.co")) {
                const newUrl = await migrateUrl(cv.secondaryImageSrc, migrated);
                if (newUrl !== cv.secondaryImageSrc) {
                    cv.secondaryImageSrc = newUrl;
                    changed = true;
                }
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
            }
            else {
                updatedCount++;
                console.log(`  📝 DB updated for "${product.name}"`);
            }
        }
        else {
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
