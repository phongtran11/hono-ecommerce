import { Hono } from "hono";
import { eq, and, sql } from "drizzle-orm";
import {
  products,
  productVendors,
  vendors,
  orders,
  orderItems,
} from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import type { Env, CartItem } from "../types";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

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

    // Validate items and compute total
    let total = 0;
    const validatedItems: {
      productId: string;
      vendorId: string;
      quantity: number;
      price: number;
    }[] = [];

    for (const item of body.items) {
      // Validate product exists
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

      // Validate product-vendor stock
      const [pv] = await db
        .select()
        .from(productVendors)
        .where(
          and(
            eq(productVendors.productId, item.productId),
            eq(productVendors.vendorId, item.vendorId),
          ),
        )
        .limit(1);

      if (!pv) {
        return c.json(
          {
            success: false,
            message: `Product-vendor combination not found for product "${product.name}"`,
          },
          404,
        );
      }

      if (pv.stock < item.quantity) {
        return c.json(
          {
            success: false,
            message: `Insufficient stock for "${product.name}" from this vendor. Available: ${pv.stock}`,
          },
          400,
        );
      }

      const price = Number(product.price);
      total += price * item.quantity;
      validatedItems.push({
        productId: item.productId,
        vendorId: item.vendorId,
        quantity: item.quantity,
        price,
      });
    }

    // Use transaction for atomicity
    const order = await db.transaction(async (tx) => {
      // Deduct stock from product_vendors
      for (const item of validatedItems) {
        await tx
          .update(productVendors)
          .set({ stock: sql`${productVendors.stock} - ${item.quantity}` })
          .where(
            and(
              eq(productVendors.productId, item.productId),
              eq(productVendors.vendorId, item.vendorId),
            ),
          );
      }

      // Create order
      const [newOrder] = await tx
        .insert(orders)
        .values({
          userId: payload.sub,
          total: String(Math.round(total * 100) / 100),
          status: "pending",
        })
        .returning();

      // Create order items
      await tx.insert(orderItems).values(
        validatedItems.map((item) => ({
          orderId: newOrder.id,
          productId: item.productId,
          vendorId: item.vendorId,
          quantity: item.quantity,
          price: String(item.price),
        })),
      );

      return newOrder;
    });

    return c.json({ success: true, data: order }, 201);
  })

  // GET /api/orders — list orders for the authenticated user
  .get("/", async (c) => {
    const db = c.get("db");
    const payload = c.get("jwtPayload");

    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, payload.sub));

    return c.json({
      success: true,
      data: userOrders,
      total: userOrders.length,
    });
  })

  // GET /api/orders/:id — get single order for the authenticated user
  .get("/:id", async (c) => {
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

    // Get order items with vendor info
    const items = await db
      .select({
        id: orderItems.id,
        productId: orderItems.productId,
        vendorId: orderItems.vendorId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        vendorName: vendors.name,
      })
      .from(orderItems)
      .innerJoin(vendors, eq(orderItems.vendorId, vendors.id))
      .where(eq(orderItems.orderId, id));

    return c.json({ success: true, data: { ...order, items } });
  });

export { orderRoutes };
