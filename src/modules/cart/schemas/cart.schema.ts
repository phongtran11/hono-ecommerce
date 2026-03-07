import { z } from "zod";

export const addToCartSchema = z.object({
  variantId: z.string().uuid("Invalid variant ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export const cartItemParamSchema = z.object({
  itemId: z.string().uuid("Invalid cart item ID"),
});
