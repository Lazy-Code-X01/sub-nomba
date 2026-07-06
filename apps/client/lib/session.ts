import { SignJWT } from "jose";
import { NextResponse } from "next/server";

export interface SessionPayload {
  tenantId:      string;
  tenantName:    string;
  email:         string;
  apiKey:        string;
  webhookUrl:    string | null;
  webhookSecret: string | null;
}

export async function mintJwt(payload: SessionPayload): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set("sub_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure:   process.env.NODE_ENV === "production",
    path:     "/",
    maxAge:   60 * 60 * 24 * 7,
  });
}
