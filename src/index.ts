import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { productRoutes } from "./routes/products";
import { orderRoutes } from "./routes/orders";
import { aiRoutes } from "./routes/ai";
import type { Bindings } from "./types";

const app = new Hono<{ Bindings: Bindings }>();

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

// ── LLM Context Endpoints (llms.txt standard) ────────────────
app.get("/llms.txt", (c) => {
  return c.text(`
# Hono Ecommerce API

This project provides a robust API for an ecommerce store.

## Endpoints
- GET /api/products: List all products.
- GET /api/products/:id: Get a specific product.
- POST /api/orders: Place a new order.
- POST /api/ai/assistant: Ask our AI shopping assistant for help.

## Tech Stack
Hono, Cloudflare Workers, TypeScript.
  `);
});

app.get("/llms-full.txt", (c) => {
  return c.text(`
# Hono Ecommerce API - Full Documentation

This is a comprehensive guide to the Hono Ecommerce API.

## Product Management
The product catalog includes ID, name, description, price, and stock levels.

## Order Workflow
Orders require a list of items (productId and quantity). The system validates stock levels before confirming an order.

## AI Assistant
You can interact with our AI assistant via /api/ai/assistant. It has full context of the product catalog.
  `);
});

// ── Routes ──────────────────────────────────────────────────
app.route("/api/products", productRoutes);
app.route("/api/orders", orderRoutes);
app.route("/api/ai", aiRoutes);

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
