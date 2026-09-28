import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function jsonOk(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function withAuth() {
  const session = await getSession();
  if (!session) {
    return { session: null, error: await jsonError("Please sign in", 401) };
  }
  return { session, error: null };
}
