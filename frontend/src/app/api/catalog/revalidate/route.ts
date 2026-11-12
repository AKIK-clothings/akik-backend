import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { BACKEND_BASE_URL } from "@/lib/backendUrl";

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.REVALIDATE_SECRET;
    const providedSecret = req.headers.get("x-revalidate-secret");
    const authHeader = req.headers.get("authorization");
    const cookieHeader = req.headers.get("cookie");

    let authorized = Boolean(secret && providedSecret && providedSecret === secret);

    if (!authorized && (authHeader || cookieHeader)) {
      const verifyRes = await fetch(`${BACKEND_BASE_URL}/api/admin/me`, {
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
        cache: "no-store",
      });
      authorized = verifyRes.ok;
    }

    if (!authorized) {
      return NextResponse.json({ revalidated: false, error: "Unauthorized" }, { status: 401 });
    }

    revalidateTag("catalog");
    return NextResponse.json({ revalidated: true, timestamp: Date.now() });
  } catch (err: any) {
    return NextResponse.json(
      { revalidated: false, error: err?.message || "Revalidation failed" },
      { status: 500 }
    );
  }
}
