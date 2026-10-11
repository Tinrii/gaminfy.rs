import "server-only";
import { currentUser } from "@clerk/nextjs/server";
import { sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

/**
 * Mirrors the signed-in Clerk user into our users table (orders reference it).
 * Returns null when nobody is signed in.
 */
export async function syncCurrentUser() {
  const user = await currentUser();
  if (!user) return null;

  const row = {
    id: user.id,
    email: user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? "",
    displayName: user.fullName ?? user.username ?? null,
    imageUrl: user.imageUrl ?? null,
  };

  await db()
    .insert(schema.users)
    .values(row)
    .onDuplicateKeyUpdate({
      set: {
        email: row.email,
        displayName: row.displayName,
        imageUrl: row.imageUrl,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      },
    });

  return { ...row, createdAt: new Date(user.createdAt), username: user.username };
}
