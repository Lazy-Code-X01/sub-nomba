import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("sub_session")?.value;
  if (!token) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    return NextResponse.json({ data: payload });
  } catch {
    return NextResponse.json({ message: "Invalid session" }, { status: 401 });
  }
}
