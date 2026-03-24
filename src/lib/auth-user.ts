import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users, type User } from "@/db/schema";

export async function getSessionClerkId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

export async function syncClerkUser(): Promise<User | null> {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return null;
  }
  const db = getDb();
  const primaryEmail =
    clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? null;
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    clerkUser.username ||
    primaryEmail ||
    "Gebruiker";
  const imageUrl = clerkUser.imageUrl ?? null;

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkUser.id))
    .limit(1);

  const now = new Date();
  if (existing[0]) {
    const [updated] = await db
      .update(users)
      .set({
        email: primaryEmail,
        name,
        imageUrl,
        updatedAt: now,
      })
      .where(eq(users.id, existing[0].id))
      .returning();
    return updated ?? existing[0];
  }

  const [created] = await db
    .insert(users)
    .values({
      clerkId: clerkUser.id,
      email: primaryEmail,
      name,
      imageUrl,
      updatedAt: now,
    })
    .returning();

  return created ?? null;
}

export async function requireDbUser(): Promise<User> {
  const clerkId = await getSessionClerkId();
  if (!clerkId) {
    throw new Error("Niet ingelogd.");
  }
  const db = getDb();
  const row = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  if (!row[0]) {
    throw new Error("Gebruiker niet gevonden. Roep eerst /api/users/sync aan.");
  }
  return row[0];
}
