import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST() {
  try {
    revalidateTag("catalog");
    return NextResponse.json({ revalidated: true, timestamp: Date.now() });
  } catch (err: any) {
    return NextResponse.json(
      { revalidated: false, error: err?.message || "Revalidation failed" },
      { status: 500 }
    );
  }
}
