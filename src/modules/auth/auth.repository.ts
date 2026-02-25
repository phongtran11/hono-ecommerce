import { eq } from "drizzle-orm";
import { users, refreshTokens, User } from "@/db/schema";
import type { DB } from "@/db";

export async function findUserByEmail(
  db: DB,
  email: string,
): Promise<User | undefined> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user;
}

export async function createUser(
  db: DB,
  email: string,
  passwordHash: string,
  passwordSalt: string,
  name: string,
) {
  const [newUser] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      passwordSalt,
      name,
    })
    .returning({ id: users.id, email: users.email, name: users.name });
  return newUser;
}

export async function saveRefreshToken(
  db: DB,
  token: string,
  userId: string,
  expiresAt: Date,
): Promise<void> {
  await db.insert(refreshTokens).values({
    token,
    userId,
    expiresAt,
  });
}

export async function deleteRefreshToken(db: DB, token: string): Promise<void> {
  await db.delete(refreshTokens).where(eq(refreshTokens.token, token));
}
