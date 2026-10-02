import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { seed } from "@/lib/seed";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { username?: string; password?: string };
    const username = (body.username ?? "").trim().toLowerCase();
    const password = body.password ?? "";

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    // Check directly against bundled seed users — zero filesystem, zero DB dependency
    const user = seed.users.find(
      (u) => u.username.toLowerCase() === username && u.password === password,
    );

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const session = {
      userId: user.id,
      name: user.name,
      role: user.role,
      username: user.username,
    };

    // Set session cookie
    const jar = await cookies();
    jar.set("ash_session", Buffer.from(JSON.stringify(session)).toString("base64url"), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12, // 12 hours
    });

    return NextResponse.json(session, { status: 200 });
  } catch (err) {
    console.error("[login] error:", err);
    return NextResponse.json({ error: "Server error during login" }, { status: 500 });
  }
}

