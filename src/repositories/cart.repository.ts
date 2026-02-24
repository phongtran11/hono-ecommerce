import { eq, and, sql } from "drizzle-orm";
import {
  carts,
  cartItems,
  products,
  productVendors,
  vendors,
} from "../db/schema";
import { Database } from "@/db";

export class CartRepository {
  constructor(private readonly db: Database) {}

  async getCartByUserId(userId: string) {
    const [cart] = await this.db
      .select()
      .from(carts)
      .where(eq(carts.userId, userId))
      .limit(1);
    return cart;
  }

  async getCartItemsWithDetails(cartId: string) {
    return this.db
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
      .where(eq(cartItems.cartId, cartId));
  }

  async createCart(userId: string) {
    const [cart] = await this.db.insert(carts).values({ userId }).returning();
    return cart;
  }

  async getProductVendorStock(productId: string, vendorId: string) {
    const [pv] = await this.db
      .select()
      .from(productVendors)
      .where(
        and(
          eq(productVendors.productId, productId),
          eq(productVendors.vendorId, vendorId),
        ),
      )
      .limit(1);
    return pv;
  }

  async getCartItemByProductAndVendor(
    cartId: string,
    productId: string,
    vendorId: string,
  ) {
    const [existing] = await this.db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, cartId),
          eq(cartItems.productId, productId),
          eq(cartItems.vendorId, vendorId),
        ),
      )
      .limit(1);
    return existing;
  }

  async addQuantityToCartItem(cartItemId: string, extraQuantity: number) {
    const [updated] = await this.db
      .update(cartItems)
      .set({ quantity: sql`${cartItems.quantity} + ${extraQuantity}` })
      .where(eq(cartItems.id, cartItemId))
      .returning();
    return updated;
  }

  async createCartItem(
    cartId: string,
    productId: string,
    vendorId: string,
    quantity: number,
  ) {
    const [item] = await this.db
      .insert(cartItems)
      .values({
        cartId,
        productId,
        vendorId,
        quantity,
      })
      .returning();
    return item;
  }

  async getCartItemById(itemId: string, cartId: string) {
    const [item] = await this.db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId)))
      .limit(1);
    return item;
  }

  async updateCartItemQuantity(itemId: string, quantity: number) {
    const [updated] = await this.db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, itemId))
      .returning();
    return updated;
  }

  async removeCartItem(itemId: string, cartId: string) {
    const [deleted] = await this.db
      .delete(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId)))
      .returning();
    return deleted;
  }

  async deleteCart(cartId: string) {
    await this.db.delete(carts).where(eq(carts.id, cartId));
  }
}
