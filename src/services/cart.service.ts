import { eq, and, sql } from "drizzle-orm";
import { carts, cartItems, products, productVendors, vendors } from "../db/schema";
import type { Database } from "../db";

export interface CartItemDetail {
  id: string;
  productId: string;
  vendorId: string;
  quantity: number;
  name: string;
  price: string;
  image: string;
  vendorName: string;
  stock: number;
}

/**
 * Pure function to calculate the total price of items in a cart
 */
export function calculateCartTotal(items: CartItemDetail[]): number {
  const total = items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );
  // Round to 2 decimal places
  return Math.round(total * 100) / 100;
}

/**
 * Fetches a user's cart along with populated items and the calculated total.
 */
export async function getUserCart(db: Database, userId: string) {
  const [cart] = await db
    .select()
    .from(carts)
    .where(eq(carts.userId, userId))
    .limit(1);

  if (!cart) {
    return { items: [], total: 0 };
  }

  const items = await db
    .select({
      id: cartItems.id,
      productId: cartItems.productId,
      vendorId: cartItems.vendorId,
      quantity: cartItems.quantity,
      name: products.name,
      price: products.price,
      image: products.image,
      vendorName: vendors.name,
      stock: productVendors.stock,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .innerJoin(
      productVendors,
      and(
        eq(productVendors.productId, cartItems.productId),
        eq(productVendors.vendorId, cartItems.vendorId),
      ),
    )
    .innerJoin(vendors, eq(cartItems.vendorId, vendors.id))
    .where(eq(cartItems.cartId, cart.id));

  const total = calculateCartTotal(items as unknown as CartItemDetail[]);

  return { items, total };
}

/**
 * Adds an item to the user's cart. Handles stock validation and quantity updates.
 */
export async function addItemToCart(
  db: Database,
  userId: string,
  productId: string,
  vendorId: string,
  quantity: number,
) {
  // Validate product-vendor combination exists and has stock
  const [pv] = await db
    .select()
    .from(productVendors)
    .where(
      and(
        eq(productVendors.productId, productId),
        eq(productVendors.vendorId, vendorId),
      ),
    )
    .limit(1);

  if (!pv) {
    return {
      success: false,
      status: 404,
      message: "Product-vendor combination not found",
    };
  }

  if (pv.stock < quantity) {
    return {
      success: false,
      status: 400,
      message: `Insufficient stock. Available: ${pv.stock}`,
    };
  }

  let [cart] = await db
    .select()
    .from(carts)
    .where(eq(carts.userId, userId))
    .limit(1);

  if (!cart) {
    [cart] = await db.insert(carts).values({ userId }).returning();
  }

  // Check if same product+vendor already in cart → update quantity
  const [existing] = await db
    .select()
    .from(cartItems)
    .where(
      and(
        eq(cartItems.cartId, cart.id),
        eq(cartItems.productId, productId),
        eq(cartItems.vendorId, vendorId),
      ),
    )
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(cartItems)
      .set({ quantity: sql`${cartItems.quantity} + ${quantity}` })
      .where(eq(cartItems.id, existing.id))
      .returning();
    return { success: true, status: 200, data: updated };
  }

  // Otherwise, create new cart item
  const [item] = await db
    .insert(cartItems)
    .values({
      cartId: cart.id,
      productId,
      vendorId,
      quantity,
    })
    .returning();

  return { success: true, status: 201, data: item };
}

/**
 * Updates the quantity of an existing cart item
 */
export async function updateItemQuantity(
  db: Database,
  userId: string,
  itemId: string,
  quantity: number,
) {
  const [cart] = await db
    .select()
    .from(carts)
    .where(eq(carts.userId, userId))
    .limit(1);

  if (!cart) {
    return { success: false, status: 404, message: "Cart not found" };
  }

  const [item] = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)))
    .limit(1);

  if (!item) {
    return { success: false, status: 404, message: "Cart item not found" };
  }

  const [updated] = await db
    .update(cartItems)
    .set({ quantity })
    .where(eq(cartItems.id, itemId))
    .returning();

  return { success: true, status: 200, data: updated };
}

/**
 * Removes an item from the cart completely
 */
export async function removeItem(db: Database, userId: string, itemId: string) {
  const [cart] = await db
    .select()
    .from(carts)
    .where(eq(carts.userId, userId))
    .limit(1);

  if (!cart) {
    return { success: false, status: 404, message: "Cart not found" };
  }

  const [deleted] = await db
    .delete(cartItems)
    .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)))
    .returning();

  if (!deleted) {
    return { success: false, status: 404, message: "Cart item not found" };
  }

  return { success: true, status: 200, message: "Item removed" };
}

/**
 * Clears the entire cart
 */
export async function clearCart(db: Database, userId: string) {
  const [cart] = await db
    .select()
    .from(carts)
    .where(eq(carts.userId, userId))
    .limit(1);

  if (!cart) {
    return { success: true, status: 200, message: "Cart is already empty" };
  }

  await db.delete(carts).where(eq(carts.id, cart.id));
  return { success: true, status: 200, message: "Cart cleared" };
}
