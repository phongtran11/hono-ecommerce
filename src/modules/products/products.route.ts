import { Hono } from "hono";
import type { Env } from "@/types";
import { zValidator } from "@hono/zod-validator";
import { createProductSchema } from "@/modules/products/schemas/products.schema";
import * as productsService from "@/modules/products/products.service";

const productRoutes = new Hono<Env>()
  // ── POST /api/products ─────────────────────────────────────
  .post("/", zValidator("json", createProductSchema), async (c) => {
    const input = c.req.valid("json");
    const db = c.get("db");

    const result = await productsService.createProduct(db, input);

    if (!result.success) {
      return c.json({ success: false, message: result.message }, result.status);
    }

    return c.json({ success: true, data: result.data }, 201);
  });

export { productRoutes };
