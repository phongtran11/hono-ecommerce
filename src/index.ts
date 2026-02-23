import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { createDb } from "./db";
import { productRoutes } from "./routes/products";
import { orderRoutes } from "./routes/orders";
import { authRoutes } from "./routes/auth";
import type { Env } from "./types";

const app = new Hono<Env>();

// ── Middleware ───────────────────────────────────────────────
app.use("*", logger());
app.use("*", cors());
app.use("*", prettyJSON());

// ── Database middleware (inject db into context) ────────────
app.use("*", async (c, next) => {
  const db = createDb(c.env.DATABASE_URL);
  c.set("db", db);
  await next();
});

// ── Health check ────────────────────────────────────────────
app.get("/", (c) => {
  return c.json({
    name: "Hono Ecommerce API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth/register | /api/auth/login",
      products: "/api/products",
      orders: "/api/orders (requires auth)",
    },
  });
});

// ── Routes ──────────────────────────────────────────────────
app.route("/api/auth", authRoutes);
app.route("/api/products", productRoutes);
app.route("/api/orders", orderRoutes);

// ── 404 fallback ────────────────────────────────────────────
app.notFound((c) => {
  return c.json({ success: false, message: "Not Found" }, 404);
});

// ── Error handler ───────────────────────────────────────────
app.onError((err, c) => {
  console.error(`[Error] ${err.message}`);
  return c.json({ success: false, message: "Internal Server Error" }, 500);
});

export default app;
