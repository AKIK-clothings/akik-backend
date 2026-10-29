export const BACKEND_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "https://akik-server.onrender.com"
).replace(/\/$/, "");

export const CATALOG_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
};
