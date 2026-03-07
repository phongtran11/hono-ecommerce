import { Hono } from "hono";
import { deleteCookie, getCookie } from "hono/cookie";
import type { Env } from "@/types";
import { zValidator } from "@hono/zod-validator";
import * as authService from "@/modules/auth/auth.service";
import { setAuthCookies } from "@/utils/cookie";
import {
  registerSchema,
  loginSchema,
} from "@/modules/auth/schemas/auth.schema";

// ── POST /api/auth/register ─────────────────────────────────
const authRoutes = new Hono<Env>()
  .post("/register", zValidator("json", registerSchema), async (c) => {
    const { email, password, name } = c.req.valid("json");

    const db = c.get("db");

    const result = await authService.register(
      db,
      email,
      password,
      name,
      c.env.JWT_SECRET,
    );

    if (!result.success || !result.data?.user || !result.data.tokens) {
      return c.json({ success: false, message: result.message }, result.status);
    }

    setAuthCookies(
      c,
      result.data.tokens.accessToken,
      result.data.tokens.refreshToken,
    );

    return c.json({ success: true, data: result.data }, 201);
  })

  // ── POST /api/auth/login ────────────────────────────────────
  .post("/login", zValidator("json", loginSchema), async (c) => {
    const { email, password } = c.req.valid("json");
    const db = c.get("db");

    const result = await authService.login(db, email, password, c.env.JWT_SECRET);

    if (!result.success || !result.data?.user || !result.data.tokens) {
      return c.json({ success: false, message: result.message }, result.status);
    }

    setAuthCookies(
      c,
      result.data.tokens.accessToken,
      result.data.tokens.refreshToken,
    );

    return c.json({ success: true, data: result.data });
  })

  // ── POST /api/auth/logout ───────────────────────────────────
  .post("/logout", async (c) => {
    const db = c.get("db");
    await authService.logout(db, getCookie(c, "refresh_token"));

    // Clear cookies
    deleteCookie(c, "access_token", { path: "/" });
    deleteCookie(c, "refresh_token", { path: "/" });

    return c.json({ success: true, message: "Logged out successfully" });
  });

export { authRoutes };
