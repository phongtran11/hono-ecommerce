import { createMiddleware } from "hono/factory";
import { jwt } from "hono/jwt";
import type { Env } from "../types";

/**
 * JWT authentication middleware.
 * Extracts and verifies the Bearer token, then sets `jwtPayload` on the context.
 */
export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const jwtMiddleware = jwt({ secret: c.env.JWT_SECRET, alg: "HS256" });
  return jwtMiddleware(c, next);
});
