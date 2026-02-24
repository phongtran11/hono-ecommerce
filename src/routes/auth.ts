import { Context, Hono } from "hono";
import { sign } from "hono/jwt";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import { eq } from "drizzle-orm";
import { users, refreshTokens } from "../db/schema";
import { hashPassword, verifyPassword } from "../utils/password";
import type { Env } from "../types";
import { BlankInput } from "hono/types";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { AT_EXPIRES_IN_SEC, RT_EXPIRES_IN_SEC } from "../constants/auth";

const registerSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
});

const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Helper to generate cookies based on token lifetimes
async function createAuthCookies(
  c: Context<Env, "/register", BlankInput>,
  user: { id: string; email: string },
) {
  const db = c.get("db");
  const secret = c.env.JWT_SECRET;

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

  // 3. Set Cookies
  const isProd = false; // Set this based on env usually

  // Basic attributes for both cookies
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: "Lax" as const,
    path: "/",
  };

  setCookie(c, "access_token", accessToken, {
    ...cookieOptions,
    maxAge: AT_EXPIRES_IN_SEC,
  });

  setCookie(c, "refresh_token", rtString, {
    ...cookieOptions,
    maxAge: RT_EXPIRES_IN_SEC,
  });
}

// ── POST /api/auth/register ─────────────────────────────────
const authRoutes = new Hono<Env>()
  .post("/register", zValidator("json", registerSchema), async (c) => {
    const { email, password, name } = await c.req.json<{
      email: string;
      password: string;
      name: string;
    }>();

    if (!email || !password || !name) {
      return c.json(
        { success: false, message: "Email, password, and name are required" },
        400,
      );
    }

    const db = c.get("db");

    // Check if user already exists
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      return c.json(
        { success: false, message: "Email already registered" },
        409,
      );
    }

    // Hash password
    const { hash, salt } = await hashPassword(password);

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

    await createAuthCookies(c, newUser);

    return c.json({ success: true, data: { user: newUser } }, 201);
  })

  // ── POST /api/auth/login ────────────────────────────────────
  .post("/login", zValidator("json", loginSchema), async (c) => {
    const { email, password } = c.req.valid("json");

    const db = c.get("db");

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return c.json({ success: false, message: "Invalid credentials" }, 401);
    }

    const isValid = await verifyPassword(
      password,
      user.passwordHash,
      user.passwordSalt,
    );

    if (!isValid) {
      return c.json({ success: false, message: "Invalid credentials" }, 401);
    }

    const userData = { id: user.id, email: user.email, name: user.name };
    await createAuthCookies(c, userData);

    return c.json({ success: true, data: { user: userData } });
  })

  // ── POST /api/auth/logout ───────────────────────────────────
  .post("/logout", async (c) => {
    const db = c.get("db");
    const rtCookie = getCookie(c, "refresh_token"); // If a refresh token cookie exists, invalidate it in the DB
    if (rtCookie) {
      await db.delete(refreshTokens).where(eq(refreshTokens.token, rtCookie));
    }

    // Clear cookies
    deleteCookie(c, "access_token", { path: "/" });
    deleteCookie(c, "refresh_token", { path: "/" });

    return c.json({ success: true, message: "Logged out successfully" });
  });

export { authRoutes };
