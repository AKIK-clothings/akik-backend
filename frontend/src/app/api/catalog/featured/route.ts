import { NextResponse } from "next/server";
import { BACKEND_BASE_URL, CATALOG_CACHE_HEADERS } from "@/lib/backendUrl";

export const maxDuration = 60;

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/products/featured`, {
      next: { revalidate: 300, tags: ["catalog"] },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch featured products" },
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
