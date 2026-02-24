import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import type { Env } from "../types";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import * as cartService from "../services/cart.service";

const addItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  vendorId: z.string().min(1, "Vendor ID is required"),
  quantity: z.number().int().positive().optional().default(1),
});

const updateItemSchema = z.object({
  quantity: z.number().int().positive("Quantity must be greater than 0"),
});

const cartRoutes = new Hono<Env>()

  // All cart routes require authentication
  .use("/*", authMiddleware)

  // ── GET /api/cart — get the current user's cart ─────────────
  .get("/", async (c) => {
    const db = c.get("db");
    const payload = c.get("jwtPayload");

    const result = await cartService.getUserCart(db, payload.sub);

    return c.json({
      success: true,
      data: result,
    });
  })

  // ── POST /api/cart — add item to cart ───────────────────────
  .post("/", zValidator("json", addItemSchema), async (c) => {
    const db = c.get("db");
    const payload = c.get("jwtPayload");
    const body = c.req.valid("json");

    const result = await cartService.addItemToCart(
      db,
      payload.sub,
      body.productId,
      body.vendorId,
      body.quantity,
    );

    if (!result.success) {
      return c.json(
        { success: false, message: result.message },
        result.status as any,
      );
    }

    return c.json({ success: true, data: result.data }, result.status as any);
  })

  // ── PUT /api/cart/:itemId — update item quantity ────────────
  .put("/:itemId", zValidator("json", updateItemSchema), async (c) => {
    const db = c.get("db");
    const payload = c.get("jwtPayload");
    const itemId = c.req.param("itemId");
    const body = c.req.valid("json");

    const result = await cartService.updateItemQuantity(
      db,
      payload.sub,
      itemId,
      body.quantity,
    );

    if (!result.success) {
      return c.json(
        { success: false, message: result.message },
        result.status as any,
      );
    }

    return c.json({ success: true, data: result.data }, result.status as any);
  })

  // ── DELETE /api/cart/:itemId — remove item from cart ────────
  .delete("/:itemId", async (c) => {
    const db = c.get("db");
    const payload = c.get("jwtPayload");
    const itemId = c.req.param("itemId");

    const result = await cartService.removeItem(db, payload.sub, itemId);

    if (!result.success) {
      return c.json(
        { success: false, message: result.message },
        result.status as any,
      );
    }

    return c.json(
      { success: true, message: result.message },
      result.status as any,
    );
  })

  // ── DELETE /api/cart — clear entire cart ─────────────────────
  .delete("/", async (c) => {
    const db = c.get("db");
    const payload = c.get("jwtPayload");

    const result = await cartService.clearCart(db, payload.sub);

    return c.json(
      { success: result.success, message: result.message },
      result.status as any,
    );
  });

export { cartRoutes };
