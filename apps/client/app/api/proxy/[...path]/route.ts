import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:3000";

async function proxy(req: NextRequest, params: { path: string[] }) {
  const targetPath = params.path.join("/");
  const { searchParams } = new URL(req.url);
  const query = searchParams.toString();
  const targetUrl = `${BACKEND}/${targetPath}${query ? `?${query}` : ""}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const apiKey = req.headers.get("x-api-key");
  if (apiKey) headers["x-api-key"] = apiKey;

  const body = req.method !== "GET" && req.method !== "DELETE"
    ? await req.text()
    : undefined;

  const res = await fetch(targetUrl, {
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
