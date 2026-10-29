import { NextResponse } from "next/server";
import { BACKEND_BASE_URL } from "@/lib/backendUrl";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const start = Date.now();
  try {
    const [pingRes, featuredRes] = await Promise.allSettled([
      fetch(`${BACKEND_BASE_URL}/ping`, { cache: "no-store" }),
      fetch(`${BACKEND_BASE_URL}/api/products/featured`, {
        next: { revalidate: 300, tags: ["catalog"] },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      pingStatus: pingRes.status === "fulfilled" ? pingRes.value.status : "error",
      featuredStatus: featuredRes.status === "fulfilled" ? featuredRes.value.status : "error",
      latencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Keep-alive failed", latencyMs: Date.now() - start },
      { status: 500 }
    );
  }
}
