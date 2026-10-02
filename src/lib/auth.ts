import { cookies } from "next/headers";
import { seed } from "./seed";
import type { Role } from "./types";

const COOKIE = "ash_session";

export type Session = {
  userId: string;
  name: string;
  role: Role;
  username: string;
};

export async function login(username: string, password: string): Promise<Session | null> {
  // Check directly against seed users — no filesystem I/O needed.
  // This is safe for Vercel serverless where the filesystem is read-only.
  const user = seed.users.find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password,
  );
  if (!user) return null;
  const session: Session = {
    userId: user.id,
    name: user.name,
    role: user.role,
    username: user.username,
  };
  const jar = await cookies();
  jar.set(COOKIE, Buffer.from(JSON.stringify(session)).toString("base64url"), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return session;
}

export async function logout() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as Session;
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}

