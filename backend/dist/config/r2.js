"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.R2_PUBLIC_URL = exports.R2_BUCKET = exports.r2Client = void 0;
exports.getR2PublicUrl = getR2PublicUrl;
const client_s3_1 = require("@aws-sdk/client-s3");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing R2 credentials: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY");
}
// S3-compatible R2 client
exports.r2Client = new client_s3_1.S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
});
exports.R2_BUCKET = process.env.R2_BUCKET_NAME || "akik-product-images";
// Public CDN base URL (r2.dev or custom domain)
exports.R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");
/**
 * Construct the public URL for a given R2 object key.
 * Example: getR2PublicUrl("products/abc/img.webp")
 *   → "https://pub-xxx.r2.dev/products/abc/img.webp"
 */
function getR2PublicUrl(key) {
    return `${exports.R2_PUBLIC_URL}/${key}`;
}
