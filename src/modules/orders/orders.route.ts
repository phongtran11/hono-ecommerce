import { Hono } from "hono";
import type { Env } from "@/types";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "@/middleware/auth";
import * as ordersService from "./orders.service";
import {
  getOrdersSchema,
  orderIdParamSchema,
} from "./schemas/orders.schema";

const orderRoutes = new Hono<Env>()
  .use("*", authMiddleware)

  .post("/", async (c) => {
    const db = c.get("db");
    const { sub: userId } = c.get("jwtPayload");
    const result = await ordersService.createOrder(db, userId);
    return c.json(result, 201);
  })

  .get("/", zValidator("query", getOrdersSchema), async (c) => {
    const db = c.get("db");
    const { sub: userId } = c.get("jwtPayload");
    const input = c.req.valid("query");
    const result = await ordersService.getOrders(db, userId, input);
    return c.json(result, 200);
  })

  .get("/:id", zValidator("param", orderIdParamSchema), async (c) => {
    const db = c.get("db");
    const { sub: userId } = c.get("jwtPayload");
    const { id } = c.req.valid("param");
    const result = await ordersService.getOrderById(db, userId, id);
    return c.json(result, 200);
  });

export { orderRoutes };
