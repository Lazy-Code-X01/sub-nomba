import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:3000";
const COOKIE  = "sub_session";

async function getApiKeyFromCookie(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    return (payload as { apiKey?: string }).apiKey ?? null;
  } catch {
    return null;
  }
}

async function proxy(req: NextRequest, params: { path: string[] }) {
  const targetPath = params.path.join("/");
  const { searchParams } = new URL(req.url);
  const query     = searchParams.toString();
  const targetUrl = `${BACKEND}/${targetPath}${query ? `?${query}` : ""}`;

  const apiKey = await getApiKeyFromCookie(req);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) headers["x-api-key"] = apiKey;

  const body =
    req.method !== "GET" && req.method !== "DELETE"
      ? await req.text()
      : undefined;

  const res  = await fetch(targetUrl, {
    method: req.method,
    headers,
    ...(body !== undefined ? { body } : {}),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params);
}
export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params);
}
export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params);
}
export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params);
}
