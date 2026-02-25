import { createMiddleware } from "hono/factory";
import { sign, verify } from "hono/jwt";
import { getCookie, setCookie } from "hono/cookie";
import { eq } from "drizzle-orm";
import { refreshTokens } from "@/db/schema";
import type { Env } from "@/types";
import { AT_EXPIRES_IN_SEC } from "@/modules/auth/auth.constant";

/**
 * Double Cookie Auth Middleware
 * 1. Tries to read the `access_token` from cookies.
 * 2. If valid, proceeds.
 * 3. If missing or expired, checks for `refresh_token` cookie.
 * 4. If `refresh_token` exists and is valid in DB, mints a new access token,
 *    sets the new cookie, and proceeds.
 * 5. If all fail, returns 401 Unauthorized.
 */
export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const secret = c.env.JWT_SECRET;
  const db = c.get("db");

  // 1. Check Access Token
  const accessToken = getCookie(c, "access_token");

  if (accessToken) {
    try {
      const payload = await verify(accessToken, secret, "HS256");
      c.set("jwtPayload", payload);
      return await next();
    } catch (err) {
      // Access token is invalid or expired. Fall through to refresh logic.
    }
  }

  // 2. Check Refresh Token
  const refreshTokenCookie = getCookie(c, "refresh_token");

  if (!refreshTokenCookie) {
    return c.json({ success: false, message: "Unauthorized" }, 401);
  }

  // Validate Refresh Token in Database
  const rtRecord = await db.query.refreshTokens.findFirst({
    where: eq(refreshTokens.token, refreshTokenCookie),
    with: {
      user: true,
    },
  });

  if (!rtRecord) {
    // Token not found or revoked
    return c.json({ success: false, message: "Unauthorized" }, 401);
  }

  if (new Date() > rtRecord.expiresAt) {
    await db.delete(refreshTokens).where(eq(refreshTokens.id, rtRecord.id));
    return c.json(
      { success: false, message: "Unauthorized (Session Expired)" },
      401,
    );
  }

  // 3. Refresh is valid! Mint a new Access Token
  const newAccessToken = await sign(
    {
      sub: rtRecord.user.id,
      email: rtRecord.user.email,
      exp: Math.floor(Date.now() / 1000) + AT_EXPIRES_IN_SEC,
    },
    secret,
  );

  // Set the new Access Token Cookie
  const isProd = false;

  setCookie(c, "access_token", newAccessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "Strict",
    path: "/",
    maxAge: AT_EXPIRES_IN_SEC,
  });

  // Set payload and proceed
  c.set("jwtPayload", { sub: rtRecord.user.id, email: rtRecord.user.email });
  await next();
});
