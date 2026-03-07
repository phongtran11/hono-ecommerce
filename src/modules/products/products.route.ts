import { Hono } from "hono";
import type { Env } from "@/types";
import { zValidator } from "@hono/zod-validator";
import {
  createProductSchema,
  getProductsSchema,
  productIdParamSchema,
} from "@/modules/products/schemas/products.schema";
import * as productsService from "@/modules/products/products.service";

const productRoutes = new Hono<Env>()
  .get("/", zValidator("query", getProductsSchema), async (c) => {
    const input = c.req.valid("query");
    const db = c.get("db");
    const result = await productsService.getProducts(db, input);
    return c.json(result, 200);
  })

  .get("/:id", zValidator("param", productIdParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const db = c.get("db");
    const result = await productsService.getProductById(db, id);
    return c.json(result, 200);
  })

  .post("/", zValidator("json", createProductSchema), async (c) => {
    const input = c.req.valid("json");
    const db = c.get("db");
    const result = await productsService.createProduct(db, input);
    return c.json(result, 201);
  });

export { productRoutes };
