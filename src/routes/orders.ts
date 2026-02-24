import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import type { Env } from "../types";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import * as ordersService from "../services/orders.service";

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product ID is required"),
        vendorId: z.string().min(1, "Vendor ID is required"),
        quantity: z.number().int().positive("Quantity must be greater than 0"),
      }),
    )
    .min(1, "At least one item is required"),
});


const orderRoutes = new Hono<Env>()

  // All order routes require authentication
  .use("/*", authMiddleware)

  // POST /api/orders — create an order (authenticated)
  .post("/", zValidator("json", createOrderSchema), async (c) => {
    const db = c.get("db");
    const payload = c.get("jwtPayload");
    const body = c.req.valid("json");

    const result = await ordersService.createOrder(db, payload.sub, body.items);

    if (!result.success) {
      return c.json({ success: false, message: result.message }, result.status as any);
    }

    return c.json({ success: true, data: result.data }, result.status as any);
  })

  // GET /api/orders — list orders for the authenticated user
  .get("/", async (c) => {
    const db = c.get("db");
    const payload = c.get("jwtPayload");

    const result = await ordersService.getUserOrders(db, payload.sub);

    return c.json(result);
  })

  // GET /api/orders/:id — get single order for the authenticated user
  .get("/:id", async (c) => {
    const db = c.get("db");
    const payload = c.get("jwtPayload");
    const id = c.req.param("id");

    const result = await ordersService.getOrderById(db, payload.sub, id);

    if (!result.success) {
      return c.json({ success: false, message: result.message }, result.status as any);
    }

    return c.json({ success: true, data: result.data });
  });

export { orderRoutes };
