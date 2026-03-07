import { describe, it, expect, vi, beforeEach } from "vitest";
import * as cartService from "../cart.service";
import * as cartRepository from "../cart.repository";
import { NotFoundError, ValidationError, ForbiddenError } from "@/utils/errors";

vi.mock("../cart.repository");

const mockDb = {} as any;
const userId = "user-1";

const mockCart = {
  id: "cart-1",
  userId,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockVariant = {
  id: "variant-1",
  name: "Size M",
  stock: 10,
  productId: "product-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe("cartService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addToCart", () => {
    it("should throw NotFoundError when variant does not exist", async () => {
      vi.mocked(cartRepository.findVariantById).mockResolvedValue(undefined);

      await expect(
        cartService.addToCart(mockDb, userId, {
          variantId: "nonexistent",
          quantity: 1,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw ValidationError when stock is insufficient", async () => {
      vi.mocked(cartRepository.findVariantById).mockResolvedValue(mockVariant);

      await expect(
        cartService.addToCart(mockDb, userId, {
          variantId: mockVariant.id,
          quantity: 999,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("should add new item to cart", async () => {
      vi.mocked(cartRepository.findVariantById).mockResolvedValue(mockVariant);
      vi.mocked(cartRepository.findOrCreateCart).mockResolvedValue(mockCart);
      vi.mocked(cartRepository.findCartItem).mockResolvedValue(undefined);

      const mockCartItem = {
        id: "item-1",
        cartId: mockCart.id,
        variantId: mockVariant.id,
        quantity: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      vi.mocked(cartRepository.addCartItem).mockResolvedValue(mockCartItem);

      const result = await cartService.addToCart(mockDb, userId, {
        variantId: mockVariant.id,
        quantity: 2,
      });

      expect(result.status).toBe(201);
      expect(result.data).toEqual(mockCartItem);
    });

    it("should update quantity when item already in cart", async () => {
      vi.mocked(cartRepository.findVariantById).mockResolvedValue(mockVariant);
      vi.mocked(cartRepository.findOrCreateCart).mockResolvedValue(mockCart);

      const existingItem = {
        id: "item-1",
        cartId: mockCart.id,
        variantId: mockVariant.id,
        quantity: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      vi.mocked(cartRepository.findCartItem).mockResolvedValue(existingItem);

      const updatedItem = { ...existingItem, quantity: 5 };
      vi.mocked(cartRepository.updateCartItemQuantity).mockResolvedValue(
        updatedItem,
      );

      const result = await cartService.addToCart(mockDb, userId, {
        variantId: mockVariant.id,
        quantity: 2,
      });

      expect(result.status).toBe(200);
      expect(cartRepository.updateCartItemQuantity).toHaveBeenCalledWith(
        mockDb,
        existingItem.id,
        5,
      );
    });
  });

  describe("updateCartItem", () => {
    it("should throw ForbiddenError when cart item belongs to another user", async () => {
      const otherCart = { ...mockCart, id: "other-cart", userId: "other-user" };
      vi.mocked(cartRepository.findCartItemById).mockResolvedValue({
        id: "item-1",
        cartId: otherCart.id,
        variantId: mockVariant.id,
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        cart: otherCart,
      });
      vi.mocked(cartRepository.findOrCreateCart).mockResolvedValue(mockCart);

      await expect(
        cartService.updateCartItem(mockDb, userId, "item-1", { quantity: 5 }),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("clearCart", () => {
    it("should clear all cart items", async () => {
      vi.mocked(cartRepository.findOrCreateCart).mockResolvedValue(mockCart);
      vi.mocked(cartRepository.clearCart).mockResolvedValue(undefined);

      const result = await cartService.clearCart(mockDb, userId);

      expect(result.success).toBe(true);
      expect(cartRepository.clearCart).toHaveBeenCalledWith(
        mockDb,
        mockCart.id,
      );
    });
  });
});
