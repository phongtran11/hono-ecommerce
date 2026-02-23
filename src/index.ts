import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { productRoutes } from "./routes/products";
import { orderRoutes } from "./routes/orders";

const app = new Hono();

// ── Middleware ───────────────────────────────────────────────
app.use("*", logger());
app.use("*", cors());
app.use("*", prettyJSON());

// ── Health check ────────────────────────────────────────────
app.get("/", (c) => {
  return c.json({
    name: "Hono Ecommerce API",
    version: "1.0.0",
    docs: "/api",
  });
});

// ── Routes ──────────────────────────────────────────────────
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
