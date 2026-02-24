import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { products, productVendors, vendors } from "../db/schema";
import type { Env } from "../types";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const getProductsSchema = z.object({
  category: z.string().optional(),
});

const productRoutes = new Hono<Env>()

  // GET /api/products — list all, with optional ?category= filter
  .get("/", zValidator("query", getProductsSchema), async (c) => {
    const db = c.get("db");
    const { category } = c.req.valid("query");

    let result = await db.select().from(products);

    if (category) {
      result = result.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase(),
      );
    }

    // Enrich each product with its vendors & stock
    const enriched = await Promise.all(
      result.map(async (product) => {
        const pvRows = await db
          .select({
            vendorId: vendors.id,
            vendorName: vendors.name,
            stock: productVendors.stock,
          })
          .from(productVendors)
          .innerJoin(vendors, eq(productVendors.vendorId, vendors.id))
          .where(eq(productVendors.productId, product.id));

        return { ...product, vendors: pvRows };
      }),
    );

    return c.json({ success: true, data: enriched, total: enriched.length });
  })

  // GET /api/products/:id — get single product with vendors
  .get("/:id", async (c) => {
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

    const pvRows = await db
      .select({
        vendorId: vendors.id,
        vendorName: vendors.name,
        stock: productVendors.stock,
      })
      .from(productVendors)
      .innerJoin(vendors, eq(productVendors.vendorId, vendors.id))
      .where(eq(productVendors.productId, product.id));

    return c.json({ success: true, data: { ...product, vendors: pvRows } });
  });

export { productRoutes };
