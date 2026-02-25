import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { createDb } from "@/db";
import { authRoutes } from "@/modules/auth/auth.route";
import { productRoutes } from "@/modules/products/products.route";
import type { Env } from "@/types";

const app = new Hono<Env>();

// ── Middleware ───────────────────────────────────────────────
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);
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
    },
  });
});

// ── Routes ──────────────────────────────────────────────────
const routes = app
  .route("/api/auth", authRoutes)
  .route("/api/products", productRoutes);

export type AppType = typeof routes;

// ── 404 fallback ────────────────────────────────────────────
app.notFound((c) => {
  return c.json({ success: false, message: "Not Found" }, 404);
});

// ── Error handler ───────────────────────────────────────────
app.onError((err, c) => {
  console.error(err);
  return c.json({ success: false, message: err.message }, 500);
});

export default app;
