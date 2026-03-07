import type { DB } from "@/db";
import * as cartRepository from "./cart.repository";
import type { AddToCartInput, UpdateCartItemInput } from "./cart.type";
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from "@/utils/errors";

export async function getCart(db: DB, userId: string) {
  const cart = await cartRepository.getCartWithItems(db, userId);

  return {
    success: true as const,
    status: 200 as const,
    data: cart ?? { items: [] },
  };
}

export async function addToCart(
  db: DB,
  userId: string,
  input: AddToCartInput,
) {
  const variant = await cartRepository.findVariantById(db, input.variantId);
  if (!variant) {
    throw new NotFoundError("Product variant not found");
  }

  if (variant.stock < input.quantity) {
    throw new ValidationError(
      `Insufficient stock. Available: ${variant.stock}`,
    );
  }

  const cart = await cartRepository.findOrCreateCart(db, userId);

  const existingItem = await cartRepository.findCartItem(
    db,
    cart.id,
    input.variantId,
  );

  if (existingItem) {
    const newQuantity = existingItem.quantity + input.quantity;
    if (newQuantity > variant.stock) {
      throw new ValidationError(
        `Insufficient stock. Available: ${variant.stock}, in cart: ${existingItem.quantity}`,
      );
    }
    const item = await cartRepository.updateCartItemQuantity(
      db,
      existingItem.id,
      newQuantity,
    );
    return { success: true as const, status: 200 as const, data: item };
  }

  const item = await cartRepository.addCartItem(
    db,
    cart.id,
    input.variantId,
    input.quantity,
  );
  return { success: true as const, status: 201 as const, data: item };
}

export async function updateCartItem(
  db: DB,
  userId: string,
  itemId: string,
  input: UpdateCartItemInput,
) {
  const cartItem = await cartRepository.findCartItemById(db, itemId);
  if (!cartItem) {
    throw new NotFoundError("Cart item not found");
  }

  const cart = await cartRepository.findOrCreateCart(db, userId);
  if (cartItem.cartId !== cart.id) {
    throw new ForbiddenError("Cannot modify another user's cart");
  }

  const variant = await cartRepository.findVariantById(db, cartItem.variantId);
  if (!variant || variant.stock < input.quantity) {
    throw new ValidationError(
      `Insufficient stock. Available: ${variant?.stock ?? 0}`,
    );
  }

  const item = await cartRepository.updateCartItemQuantity(
    db,
    itemId,
    input.quantity,
  );
  return { success: true as const, status: 200 as const, data: item };
}

export async function removeCartItem(
  db: DB,
  userId: string,
  itemId: string,
) {
  const cartItem = await cartRepository.findCartItemById(db, itemId);
  if (!cartItem) {
    throw new NotFoundError("Cart item not found");
  }

  const cart = await cartRepository.findOrCreateCart(db, userId);
  if (cartItem.cartId !== cart.id) {
    throw new ForbiddenError("Cannot modify another user's cart");
  }

  await cartRepository.deleteCartItem(db, itemId);
  return {
    success: true as const,
    status: 200 as const,
    message: "Item removed",
  };
}

export async function clearCart(db: DB, userId: string) {
  const cart = await cartRepository.findOrCreateCart(db, userId);
  await cartRepository.clearCart(db, cart.id);
  return {
    success: true as const,
    status: 200 as const,
    message: "Cart cleared",
  };
}
