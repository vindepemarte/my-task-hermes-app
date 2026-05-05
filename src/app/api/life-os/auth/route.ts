import { NextRequest, NextResponse } from "next/server";
import { hasPassword, login, setupPassword } from "@/lib/lifeOsAuth";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ passwordConfigured: await hasPassword() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to read auth status" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { mode?: string; password?: string };
    if (!body.password) return NextResponse.json({ error: "Password required" }, { status: 400 });
    const token = body.mode === "setup" ? await setupPassword(body.password) : await login(body.password);
    return NextResponse.json({ token });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Authentication failed" }, { status: 400 });
  }
}
