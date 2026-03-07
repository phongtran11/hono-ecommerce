import type { DB } from "@/db";
import { eq, and, count, sql } from "drizzle-orm";
import {
  orders,
  orderItems,
  cartItems,
  productVariants,
} from "@/db/schema";
import { notDeleted } from "@/utils/soft-delete";
import { ValidationError } from "@/utils/errors";

export async function createOrderInTransaction(
  db: DB,
  userId: string,
  cartId: string,
  items: Array<{ variantId: string; quantity: number; price: string }>,
  total: string,
) {
  return await db.transaction(async (tx) => {
    for (const item of items) {
      const result = await tx
        .update(productVariants)
        .set({ stock: sql`${productVariants.stock} - ${item.quantity}` })
        .where(
          and(
            eq(productVariants.id, item.variantId),
            sql`${productVariants.stock} >= ${item.quantity}`,
          ),
        )
        .returning();

      if (result.length === 0) {
        throw new ValidationError(
          `Insufficient stock for variant ${item.variantId}`,
        );
      }
    }

    const [order] = await tx
      .insert(orders)
      .values({ userId, total, status: "pending" })
      .returning();

    const insertedItems = await tx
      .insert(orderItems)
      .values(
        items.map((item) => ({
          orderId: order.id,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        })),
      )
      .returning();

    await tx.delete(cartItems).where(eq(cartItems.cartId, cartId));

    return { ...order, items: insertedItems };
  });
}

export async function findOrdersByUserId(
  db: DB,
  userId: string,
  opts: { limit: number; offset: number },
) {
  return await db.query.orders.findMany({
    where: and(eq(orders.userId, userId), notDeleted(orders.deletedAt)),
    with: {
      items: {
        with: {
          variant: {
            with: {
              prices: true,
            },
          },
        },
      },
    },
    limit: opts.limit,
    offset: opts.offset,
    orderBy: (orders, { desc }) => [desc(orders.createdAt)],
  });
}

export async function countOrdersByUserId(db: DB, userId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(orders)
    .where(and(eq(orders.userId, userId), notDeleted(orders.deletedAt)));
  return Number(result.count);
}

export async function findOrderById(
  db: DB,
  id: string,
  userId: string,
) {
  return await db.query.orders.findFirst({
    where: and(
      eq(orders.id, id),
      eq(orders.userId, userId),
      notDeleted(orders.deletedAt),
    ),
    with: {
      items: {
        with: {
          variant: {
            with: {
              prices: true,
            },
          },
        },
      },
    },
  });
}
