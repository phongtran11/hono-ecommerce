import type { DB } from "@/db";
import * as ordersRepository from "./orders.repository";
import * as cartRepository from "../cart/cart.repository";
import { NotFoundError, ValidationError } from "@/utils/errors";
import {
  createPaginatedResponse,
  type PaginationInput,
} from "@/utils/pagination";

export async function createOrder(db: DB, userId: string) {
  const cart = await cartRepository.getCartWithItems(db, userId);

  if (!cart || cart.items.length === 0) {
    throw new ValidationError("Cart is empty");
  }

  const items = cart.items.map((item) => {
    if (!item.variant.prices.length) {
      throw new ValidationError(
        `No price found for variant: ${item.variant.name}`,
      );
    }
    const lowestPrice = item.variant.prices.reduce(
      (min, p) => (Number(p.price) < Number(min.price) ? p : min),
      item.variant.prices[0],
    );
    return {
      variantId: item.variantId,
      quantity: item.quantity,
      price: lowestPrice.price,
    };
  });

  const total = items
    .reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
    .toFixed(2);

  const order = await ordersRepository.createOrderInTransaction(
    db,
    userId,
    cart.id,
    items,
    total,
  );

  return { success: true as const, status: 201 as const, data: order };
}

export async function getOrders(
  db: DB,
  userId: string,
  input: PaginationInput,
) {
  const offset = (input.page - 1) * input.limit;

  const [ordersList, total] = await Promise.all([
    ordersRepository.findOrdersByUserId(db, userId, {
      limit: input.limit,
      offset,
    }),
    ordersRepository.countOrdersByUserId(db, userId),
  ]);

  return {
    success: true as const,
    status: 200 as const,
    data: createPaginatedResponse(ordersList, total, input.page, input.limit),
  };
}

export async function getOrderById(
  db: DB,
  userId: string,
  orderId: string,
) {
  const order = await ordersRepository.findOrderById(db, orderId, userId);

  if (!order) {
    throw new NotFoundError("Order not found");
  }

  return { success: true as const, status: 200 as const, data: order };
}
