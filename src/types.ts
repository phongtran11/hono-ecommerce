import type { Database } from "./db";

// ── Cloudflare env bindings ─────────────────────────────────
export type Env = {
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    db: Database;
    jwtPayload: { sub: string; email: string };
  };
};

// ── Cart ────────────────────────────────────────────────────
export interface CartItem {
  productId: string;
  quantity: number;
}
