import { NextRequest, NextResponse } from "next/server";
import { BACKEND_BASE_URL, CATALOG_CACHE_HEADERS } from "@/lib/backendUrl";

export const maxDuration = 60;

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const res = await fetch(
      `${BACKEND_BASE_URL}/api/products/${encodeURIComponent(slug)}`,
      {
        next: { revalidate: 300, tags: ["catalog"] },
      }
    );

    if (res.status === 404) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch product" },
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
