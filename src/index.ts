import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { createDb } from "@/db";
import { authRoutes } from "@/modules/auth/auth.route";
import { productRoutes } from "@/modules/products/products.route";
import { cartRoutes } from "@/modules/cart/cart.route";
import { orderRoutes } from "@/modules/orders/orders.route";
import { AppError } from "@/utils/errors";
import type { Env } from "@/types";

const app = new Hono<Env>();

// ── Middleware ───────────────────────────────────────────────
app.use("*", logger());
app.use("*", async (c, next) => {
  return cors({
    origin: c.env.CORS_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  })(c, next);
});
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
      auth: "/api/auth",
      products: "/api/products",
      cart: "/api/cart",
      orders: "/api/orders",
    },
  });
});

// ── Routes ──────────────────────────────────────────────────
const routes = app
  .route("/api/auth", authRoutes)
  .route("/api/products", productRoutes)
  .route("/api/cart", cartRoutes)
  .route("/api/orders", orderRoutes);

export type AppType = typeof routes;

// ── 404 fallback ────────────────────────────────────────────
app.notFound((c) => {
  return c.json({ success: false, message: "Not Found" }, 404);
});

// ── Global error handler ────────────────────────────────────
app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json({ success: false, message: err.message }, err.status);
  }
  console.error(err);
  return c.json({ success: false, message: "Internal Server Error" }, 500);
});

export default app;
