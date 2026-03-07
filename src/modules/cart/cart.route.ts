import { Hono } from "hono";
import type { Env } from "@/types";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "@/middleware/auth";
import * as cartService from "./cart.service";
import {
  addToCartSchema,
  updateCartItemSchema,
  cartItemParamSchema,
} from "./schemas/cart.schema";

const cartRoutes = new Hono<Env>()
  .use("*", authMiddleware)

  .get("/", async (c) => {
    const db = c.get("db");
    const { sub: userId } = c.get("jwtPayload");
    const result = await cartService.getCart(db, userId);
    return c.json(result, 200);
  })

  .post("/items", zValidator("json", addToCartSchema), async (c) => {
    const db = c.get("db");
    const { sub: userId } = c.get("jwtPayload");
    const input = c.req.valid("json");
    const result = await cartService.addToCart(db, userId, input);
    return c.json(result, result.status);
  })

  .patch(
    "/items/:itemId",
    zValidator("param", cartItemParamSchema),
    zValidator("json", updateCartItemSchema),
    async (c) => {
      const db = c.get("db");
      const { sub: userId } = c.get("jwtPayload");
      const { itemId } = c.req.valid("param");
      const input = c.req.valid("json");
      const result = await cartService.updateCartItem(
        db,
        userId,
        itemId,
        input,
      );
      return c.json(result, 200);
    },
  )

  .delete(
    "/items/:itemId",
    zValidator("param", cartItemParamSchema),
    async (c) => {
      const db = c.get("db");
      const { sub: userId } = c.get("jwtPayload");
      const { itemId } = c.req.valid("param");
      const result = await cartService.removeCartItem(db, userId, itemId);
      return c.json(result, 200);
    },
  )

  .delete("/", async (c) => {
    const db = c.get("db");
    const { sub: userId } = c.get("jwtPayload");
    const result = await cartService.clearCart(db, userId);
    return c.json(result, 200);
  });

export { cartRoutes };
