"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = slugify;
function slugify(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "") // remove special chars
        .replace(/[\s_-]+/g, "-") // replace spaces/underscores with hyphens
        .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
}
