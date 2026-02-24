import { Hono } from "hono";
import type { Env } from "../types";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import * as productsService from "../services/products.service";

const getProductsSchema = z.object({
  category: z.string().optional(),
});

const productRoutes = new Hono<Env>()

  // GET /api/products — list all, with optional ?category= filter
  .get("/", zValidator("query", getProductsSchema), async (c) => {
    const db = c.get("db");
    const { category } = c.req.valid("query");

    const result = await productsService.getProducts(db, category);

    return c.json(result);
  })

  // GET /api/products/:id — get single product with vendors
  .get("/:id", async (c) => {
    const db = c.get("db");
    const id = c.req.param("id");

    const result = await productsService.getProductById(db, id);

    if (!result.success) {
      return c.json({ success: false, message: result.message }, result.status as any);
    }

    return c.json({ success: true, data: result.data });
  });

export { productRoutes };
