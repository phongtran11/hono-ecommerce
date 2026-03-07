import type { Context } from "hono";
import { setCookie } from "hono/cookie";
import type { Env } from "@/types";
import {
  AT_EXPIRES_IN_SEC,
  RT_EXPIRES_IN_SEC,
} from "@/modules/auth/auth.constant";

function getCookieOptions(env: Env["Bindings"]) {
  const isProd = env.ENVIRONMENT === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "Lax" as const,
    path: "/",
  };
}

export function setAuthCookies(
  c: Context<Env, string>,
  accessToken: string,
  refreshToken: string,
): void {
  const options = getCookieOptions(c.env);

  setCookie(c, "access_token", accessToken, {
    ...options,
    maxAge: AT_EXPIRES_IN_SEC,
  });

  setCookie(c, "refresh_token", refreshToken, {
    ...options,
    maxAge: RT_EXPIRES_IN_SEC,
  });
}

export function setAccessTokenCookie(
  c: Context<Env, string>,
  accessToken: string,
): void {
  const options = getCookieOptions(c.env);

  setCookie(c, "access_token", accessToken, {
    ...options,
    maxAge: AT_EXPIRES_IN_SEC,
  });
}
