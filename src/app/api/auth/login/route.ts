import { login } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";

export async function POST(request: Request) {
  const body = (await request.json()) as { username?: string; password?: string };
  if (!body.username || !body.password) {
    return jsonError("Username and password are required", 400);
  }
  const session = await login(body.username, body.password);
  if (!session) return jsonError("Invalid credentials", 401);
  return jsonOk(session);
}
