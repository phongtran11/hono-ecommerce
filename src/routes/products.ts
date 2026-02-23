import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { products } from "../db/schema";
import type { Env } from "../types";

const productRoutes = new Hono<Env>();

// GET /api/products — list all, with optional ?category= filter
productRoutes.get("/", async (c) => {
  const db = c.get("db");
  const category = c.req.query("category");

  let result = await db.select().from(products);

  if (category) {
    result = result.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase(),
    );
  }

  return c.json({ success: true, data: result, total: result.length });
});

// GET /api/products/:id — get single product
productRoutes.get("/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!product) {
    return c.json({ success: false, message: "Product not found" }, 404);
  }

  return c.json({ success: true, data: product });
});

export { productRoutes };
