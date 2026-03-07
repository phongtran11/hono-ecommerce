import type { DB } from "@/db";
import { eq, and } from "drizzle-orm";
import { carts, cartItems, productVariants } from "@/db/schema";

export async function findOrCreateCart(db: DB, userId: string) {
  const result = await db
    .insert(carts)
    .values({ userId })
    .onConflictDoNothing({ target: carts.userId })
    .returning();

  if (result.length > 0) return result[0];

  const existing = await db.query.carts.findFirst({
    where: eq(carts.userId, userId),
  });

  return existing!;
}

export async function getCartWithItems(db: DB, userId: string) {
  return await db.query.carts.findFirst({
    where: eq(carts.userId, userId),
    with: {
      items: {
        with: {
          variant: {
            with: {
              prices: true,
              images: true,
            },
          },
        },
      },
    },
  });
}

export async function findCartItem(
  db: DB,
  cartId: string,
  variantId: string,
) {
  return await db.query.cartItems.findFirst({
    where: and(
      eq(cartItems.cartId, cartId),
      eq(cartItems.variantId, variantId),
    ),
  });
}

export async function findCartItemById(db: DB, itemId: string) {
  return await db.query.cartItems.findFirst({
    where: eq(cartItems.id, itemId),
    with: { cart: true },
  });
}

export async function addCartItem(
  db: DB,
  cartId: string,
  variantId: string,
  quantity: number,
) {
  const [item] = await db
    .insert(cartItems)
    .values({ cartId, variantId, quantity })
    .returning();
  return item;
}

export async function updateCartItemQuantity(
  db: DB,
  itemId: string,
  quantity: number,
) {
  const [item] = await db
    .update(cartItems)
    .set({ quantity })
    .where(eq(cartItems.id, itemId))
    .returning();
  return item;
}

export async function deleteCartItem(db: DB, itemId: string) {
  await db.delete(cartItems).where(eq(cartItems.id, itemId));
}

export async function clearCart(db: DB, cartId: string) {
  await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
}

export async function findVariantById(db: DB, variantId: string) {
  return await db.query.productVariants.findFirst({
    where: eq(productVariants.id, variantId),
  });
}
