import { Hono } from "hono";
import { products } from "../data";

const productRoutes = new Hono();

// GET /api/products — list all, with optional ?category= filter
productRoutes.get("/", (c) => {
  const category = c.req.query("category");
  const result = category
    ? products.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase(),
      )
    : products;
  return c.json({ success: true, data: result, total: result.length });
});

// GET /api/products/:id — get single product
productRoutes.get("/:id", (c) => {
  const product = products.find((p) => p.id === c.req.param("id"));
  if (!product) {
    return c.json({ success: false, message: "Product not found" }, 404);
  }
  return c.json({ success: true, data: product });
});

export { productRoutes };
