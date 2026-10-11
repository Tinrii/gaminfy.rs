import "server-only";
import { auth } from "@clerk/nextjs/server";
import { forbidden, unauthorized } from "next/navigation";
import { env } from "@/lib/env";

export function isAdmin(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return env()
    .ADMIN_USER_IDS.split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .includes(userId);
}

/** Returns the signed-in Clerk user ID or renders the 401 boundary. */
export async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) unauthorized();
  return userId;
}

/** Server-side admin gate. Call this in every admin page, action and route handler. */
export async function requireAdmin(): Promise<string> {
  const userId = await requireUserId();
  if (!isAdmin(userId)) forbidden();
  return userId;
}
