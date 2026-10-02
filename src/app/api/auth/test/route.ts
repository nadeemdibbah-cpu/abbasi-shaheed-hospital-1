import { seed } from "@/lib/seed";
import { NextResponse } from "next/server";

// Temporary debug endpoint — remove after login is confirmed working
export async function POST(request: Request) {
  const body = (await request.json()) as { username?: string; password?: string };
  const { username, password } = body;

  const allUsers = seed.users.map((u) => ({ username: u.username, role: u.role }));

  if (!username || !password) {
    return NextResponse.json({ error: "No credentials provided", users: allUsers }, { status: 400 });
  }

  const match = seed.users.find(
    (u) =>
      u.username.toLowerCase() === username.trim().toLowerCase() &&
      u.password === password,
  );

  return NextResponse.json({
    success: !!match,
    attempted: { username: username.trim(), password },
    matchedUser: match ? { id: match.id, name: match.name, role: match.role } : null,
    allUsers,
  });
}
