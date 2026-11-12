import { NextRequest, NextResponse } from "next/server";
import { BACKEND_BASE_URL, CATALOG_CACHE_HEADERS } from "@/lib/backendUrl";

export const maxDuration = 60;

const ALLOWED_CATALOG_PARAMS = [
  "category",
  "sub",
  "sort",
  "q",
  "size",
  "color",
  "inStock",
  "minPrice",
  "maxPrice",
  "limit",
  "section",
];

export async function GET(req: NextRequest) {
  try {
    const filtered = new URLSearchParams();
    for (const key of ALLOWED_CATALOG_PARAMS) {
      const values = req.nextUrl.searchParams.getAll(key);
      for (const val of values) {
        if (val) filtered.append(key, val);
      }
    }
    const query = filtered.toString();
    const suffix = query ? `?${query}` : "";
    const res = await fetch(`${BACKEND_BASE_URL}/api/products${suffix}`, {
      next: { revalidate: 300, tags: ["catalog"] },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { headers: CATALOG_CACHE_HEADERS });
  } catch {
    return NextResponse.json(
      { error: "Backend unreachable" },
      { status: 502 }
    );
  }
}
