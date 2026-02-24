import { CartRepository } from "../repositories/cart.repository";

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

export class CartService {
  constructor(private readonly cartRepo: CartRepository) {}

  /**
   * Pure function to calculate the total price of items in a cart
   */
  calculateCartTotal(items: CartItemDetail[]): number {
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
  async getUserCart(userId: string) {
    const cart = await this.cartRepo.getCartByUserId(userId);

    if (!cart) {
      return { items: [], total: 0 };
    }

    const items = await this.cartRepo.getCartItemsWithDetails(cart.id);
    const total = this.calculateCartTotal(items);

    return { items, total };
  }

  /**
   * Adds an item to the user's cart. Handles stock validation and quantity updates.
   */
  async addItemToCart(
    userId: string,
    productId: string,
    vendorId: string,
    quantity: number,
  ) {
    // Validate product-vendor combination exists and has stock
    const pv = await this.cartRepo.getProductVendorStock(productId, vendorId);

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

    // Get or create cart
    let cart = await this.cartRepo.getCartByUserId(userId);

    if (!cart) {
      cart = await this.cartRepo.createCart(userId);
    }

    // Check if same product+vendor already in cart → update quantity
    const existing = await this.cartRepo.getCartItemByProductAndVendor(
      cart.id,
      productId,
      vendorId,
    );

    if (existing) {
      const updated = await this.cartRepo.addQuantityToCartItem(
        existing.id,
        quantity,
      );
      return { success: true, status: 200, data: updated };
    }

    // Otherwise, create new cart item
    const item = await this.cartRepo.createCartItem(
      cart.id,
      productId,
      vendorId,
      quantity,
    );

    return { success: true, status: 201, data: item };
  }

  /**
   * Updates the quantity of an existing cart item
   */
  async updateItemQuantity(userId: string, itemId: string, quantity: number) {
    const cart = await this.cartRepo.getCartByUserId(userId);

    if (!cart) {
      return { success: false, status: 404, message: "Cart not found" };
    }

    const item = await this.cartRepo.getCartItemById(itemId, cart.id);

    if (!item) {
      return { success: false, status: 404, message: "Cart item not found" };
    }

    const updated = await this.cartRepo.updateCartItemQuantity(
      itemId,
      quantity,
    );
    return { success: true, status: 200, data: updated };
  }

  /**
   * Removes an item from the cart completely
   */
  async removeItem(userId: string, itemId: string) {
    const cart = await this.cartRepo.getCartByUserId(userId);

    if (!cart) {
      return { success: false, status: 404, message: "Cart not found" };
    }

    const deleted = await this.cartRepo.removeCartItem(itemId, cart.id);

    if (!deleted) {
      return { success: false, status: 404, message: "Cart item not found" };
    }

    return { success: true, status: 200, message: "Item removed" };
  }

  /**
   * Clears the entire cart
   */
  async clearCart(userId: string) {
    const cart = await this.cartRepo.getCartByUserId(userId);

    if (!cart) {
      return { success: true, status: 200, message: "Cart is already empty" };
    }

    await this.cartRepo.deleteCart(cart.id);
    return { success: true, status: 200, message: "Cart cleared" };
  }
}
