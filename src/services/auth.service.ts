import { eq } from "drizzle-orm";
import { users, refreshTokens } from "../db/schema";
import { hashPassword, verifyPassword } from "../utils/password";
import { sign } from "hono/jwt";
import { AT_EXPIRES_IN_SEC, RT_EXPIRES_IN_SEC } from "../constants/auth";
import type { Database } from "../db";

export async function createAuthCookies(
    db: Database,
    secret: string,
    user: { id: string; email: string },
) {
    // 1. Create short-lived Access Token
    const accessToken = await sign(
        {
            sub: user.id,
            email: user.email,
            exp: Math.floor(Date.now() / 1000) + AT_EXPIRES_IN_SEC,
        },
        secret,
    );

    // 2. Create long-lived Refresh Token
    const rtString = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + RT_EXPIRES_IN_SEC * 1000);

    // Store RT in database
    await db.insert(refreshTokens).values({
        token: rtString,
        userId: user.id,
        expiresAt,
    });

    return { accessToken, rtString };
}

export async function registerUser(
    db: Database,
    email: string,
    passwordRaw: string,
    name: string,
) {
    // Check if user already exists
    const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

    if (existing.length > 0) {
        return { success: false, status: 409, message: "Email already registered" };
    }

    // Hash password
    const { hash, salt } = await hashPassword(passwordRaw);

    // Insert user
    const [newUser] = await db
        .insert(users)
        .values({
            email,
            passwordHash: hash,
            passwordSalt: salt,
            name,
        })
        .returning({ id: users.id, email: users.email, name: users.name });

    return { success: true, status: 201, user: newUser };
}

export async function loginUser(
    db: Database,
    email: string,
    passwordRaw: string,
) {
    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

    if (!user) {
        return { success: false, status: 401, message: "Invalid credentials" };
    }

    const isValid = await verifyPassword(
        passwordRaw,
        user.passwordHash,
        user.passwordSalt,
    );

    if (!isValid) {
        return { success: false, status: 401, message: "Invalid credentials" };
    }

    return {
        success: true,
        status: 200,
        user: { id: user.id, email: user.email, name: user.name },
    };
}

export async function logoutUser(db: Database, refreshTokenCookie?: string) {
    if (refreshTokenCookie) {
        await db
            .delete(refreshTokens)
            .where(eq(refreshTokens.token, refreshTokenCookie));
    }
}
