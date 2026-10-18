import multer from "multer";

// Store files in memory — upload directly to Supabase Storage from buffer
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max per file
    files: 25, // max 25 files per request for multi-variant products
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/jpg",
      "image/pjpeg",
      "image/png",
      "image/webp",
      "image/jfif",
      "image/avif",
      "image/x-png",
    ];
    const mime = (file.mimetype || "").toLowerCase();
    const isAllowedMime = allowedMimes.includes(mime);
    const hasValidExt = Boolean(file.originalname.toLowerCase().match(/\.(jpe?g|png|webp|jfif|avif)$/));

    if (isAllowedMime || hasValidExt) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, WebP, and AVIF images are allowed"));
    }
  },
});
