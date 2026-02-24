import { Context, Hono } from "hono";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import type { Env } from "../types";
import { BlankInput } from "hono/types";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { AT_EXPIRES_IN_SEC, RT_EXPIRES_IN_SEC } from "../constants/auth";
import * as authService from "../services/auth.service";

const registerSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
});

const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Helper to apply cookies manually based on auth tokens
async function setAuthCookies(
  c: Context<Env, "/register" | "/login", BlankInput>,
  accessToken: string,
  refreshToken: string,
) {

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

  setCookie(c, "refresh_token", refreshToken, {
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

    const result = await authService.registerUser(db, email, password, name);

    if (!result.success || !result.user) {
      return c.json({ success: false, message: result.message }, result.status as any);
    }

    const tokens = await authService.createAuthCookies(db, c.env.JWT_SECRET, result.user);
    await setAuthCookies(c, tokens.accessToken, tokens.rtString);

    return c.json({ success: true, data: { user: result.user } }, 201);
  })

  // ── POST /api/auth/login ────────────────────────────────────
  .post("/login", zValidator("json", loginSchema), async (c) => {
    const { email, password } = c.req.valid("json");

    const db = c.get("db");

    const result = await authService.loginUser(db, email, password);

    if (!result.success || !result.user) {
      return c.json({ success: false, message: result.message }, result.status as any);
    }

    const tokens = await authService.createAuthCookies(db, c.env.JWT_SECRET, result.user);
    await setAuthCookies(c, tokens.accessToken, tokens.rtString);

    return c.json({ success: true, data: { user: result.user } });
  })

  // ── POST /api/auth/logout ───────────────────────────────────
  .post("/logout", async (c) => {
    const db = c.get("db");
    await authService.logoutUser(db, getCookie(c, "refresh_token"));

    // Clear cookies
    deleteCookie(c, "access_token", { path: "/" });
    deleteCookie(c, "refresh_token", { path: "/" });

    return c.json({ success: true, message: "Logged out successfully" });
  });

export { authRoutes };
