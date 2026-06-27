import { eq } from "drizzle-orm"

import { db } from "@/db"
import { users } from "@/db/schema"

export type UserProfile = {
  name: string | null
  email: string | null
  image: string | null
}

/** Fetch the public profile fields for a user (name/email/image). */
export async function getUserProfile(
  userId: string
): Promise<UserProfile | null> {
  const [user] = await db
    .select({ name: users.name, email: users.email, image: users.image })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  return user ?? null
}
