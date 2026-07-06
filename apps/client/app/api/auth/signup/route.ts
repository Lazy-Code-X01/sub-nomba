import { NextRequest, NextResponse } from "next/server";
import { mintJwt, setSessionCookie } from "@/lib/session";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res  = await fetch(`${BACKEND}/api/v1/auth/signup`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    const json = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { message: json.message ?? "Signup failed" },
        { status: res.status }
      );
    }

    const token    = await mintJwt(json.data);
    const response = NextResponse.json({ ok: true });
    setSessionCookie(response, token);
    return response;
  } catch (err) {
    console.error("[auth/signup]", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
