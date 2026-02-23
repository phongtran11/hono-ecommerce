import { Hono } from "hono";
import { products, orders, generateOrderId } from "../data";
import type { CartItem } from "../types";

const orderRoutes = new Hono();

// POST /api/orders — create an order
orderRoutes.post("/", async (c) => {
  const body = await c.req.json<{ items: CartItem[] }>();

  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    return c.json({ success: false, message: "Items are required" }, 400);
  }

  // Validate items and compute total
  let total = 0;
  for (const item of body.items) {
    const product = products.find((p) => p.id === item.productId);
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
    total += product.price * item.quantity;
  }

  // Deduct stock
  for (const item of body.items) {
    const product = products.find((p) => p.id === item.productId)!;
    product.stock -= item.quantity;
  }

  const order = {
    id: generateOrderId(),
    items: body.items,
    total: Math.round(total * 100) / 100,
    status: "pending" as const,
    createdAt: new Date().toISOString(),
  };

  orders.push(order);

  return c.json({ success: true, data: order }, 201);
});

// GET /api/orders — list all orders
orderRoutes.get("/", (c) => {
  return c.json({ success: true, data: orders, total: orders.length });
});

// GET /api/orders/:id — get single order
orderRoutes.get("/:id", (c) => {
  const order = orders.find((o) => o.id === c.req.param("id"));
  if (!order) {
    return c.json({ success: false, message: "Order not found" }, 404);
  }
  return c.json({ success: true, data: order });
});

export { orderRoutes };
