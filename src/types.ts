import { ContentfulStatusCode } from "hono/utils/http-status";
import { DB } from "@/db";

// ── Cloudflare env bindings ─────────────────────────────────
export type Env = {
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
    ENVIRONMENT: string;
    CORS_ORIGIN: string;
  };
  Variables: {
    db: DB;
    jwtPayload: { sub: string; email: string };
  };
};

// ── Response ────────────────────────────────────────────────
export type Response<T> = {
  success: boolean;
  status: ContentfulStatusCode;
  message?: string;
  data?: T;
};
