"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
// Store files in memory — we'll upload directly to Supabase Storage from buffer
exports.upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 4 * 1024 * 1024, // 4MB max per file
        files: 5, // max 5 files per request
    },
    fileFilter: (_req, file, cb) => {
        const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
        }
    },
});
