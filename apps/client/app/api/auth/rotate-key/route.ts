import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { mintJwt, setSessionCookie, SessionPayload } from "@/lib/session";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:3000";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("sub_session")?.value;
  if (!token) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const session = payload as unknown as SessionPayload;

    const res  = await fetch(`${BACKEND}/api/v1/tenants/${session.tenantId}/rotate-key`, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key":    session.apiKey,
      },
    });
    const json = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { message: json.message ?? "Failed to rotate key" },
        { status: res.status }
      );
    }

    const updated: SessionPayload = { ...session, apiKey: json.data.apiKey };
    const newToken  = await mintJwt(updated);
    const response  = NextResponse.json({ data: { apiKey: json.data.apiKey } });
    setSessionCookie(response, newToken);
    return response;
  } catch (err) {
    console.error("[auth/rotate-key]", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
