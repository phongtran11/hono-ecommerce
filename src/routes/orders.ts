import { Hono } from "hono";
import { eq, sql } from "drizzle-orm";
import { products, orders, orderItems } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import type { Env, CartItem } from "../types";

const orderRoutes = new Hono<Env>();

// All order routes require authentication
orderRoutes.use("/*", authMiddleware);

// POST /api/orders — create an order (authenticated)
orderRoutes.post("/", async (c) => {
  const db = c.get("db");
  const payload = c.get("jwtPayload");
  const body = await c.req.json<{ items: CartItem[] }>();

  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    return c.json({ success: false, message: "Items are required" }, 400);
  }

  // Validate items and compute total
  let total = 0;
  const validatedItems: {
    productId: string;
    quantity: number;
    price: number;
  }[] = [];

  for (const item of body.items) {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, item.productId))
      .limit(1);

    if (!product) {
      return c.json(
        { success: false, message: `Product ${item.productId} not found` },
        404,
      );
    }

    if (item.quantity <= 0) {
      return c.json(
        { success: false, message: "Quantity must be greater than 0" },
        400,
      );
    }

    if (product.stock < item.quantity) {
      return c.json(
        {
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.stock}`,
        },
        400,
      );
    }

    const price = Number(product.price);
    total += price * item.quantity;
    validatedItems.push({
      productId: item.productId,
      quantity: item.quantity,
      price,
    });
  }

  // Deduct stock
  for (const item of validatedItems) {
    await db
      .update(products)
      .set({ stock: sql`${products.stock} - ${item.quantity}` })
      .where(eq(products.id, item.productId));
  }

  // Create order
  const [order] = await db
    .insert(orders)
    .values({
      userId: payload.sub,
      total: String(Math.round(total * 100) / 100),
      status: "pending",
    })
    .returning();

  // Create order items
  await db.insert(orderItems).values(
    validatedItems.map((item) => ({
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      price: String(item.price),
    })),
  );

  return c.json({ success: true, data: order }, 201);
});

// GET /api/orders — list orders for the authenticated user
orderRoutes.get("/", async (c) => {
  const db = c.get("db");
  const payload = c.get("jwtPayload");

  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, payload.sub));

  return c.json({ success: true, data: userOrders, total: userOrders.length });
});

// GET /api/orders/:id — get single order for the authenticated user
orderRoutes.get("/:id", async (c) => {
  const db = c.get("db");
  const payload = c.get("jwtPayload");
  const id = c.req.param("id");

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  if (!order || order.userId !== payload.sub) {
    return c.json({ success: false, message: "Order not found" }, 404);
  }

  // Get order items
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, id));

  return c.json({ success: true, data: { ...order, items } });
});

export { orderRoutes };
