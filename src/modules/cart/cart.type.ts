import type {
  Cart,
  CartItem,
  ProductVariant,
  Price,
  ProductVariantImage,
} from "@/db/schema";
import type { z } from "zod";
import type {
  addToCartSchema,
  updateCartItemSchema,
} from "./schemas/cart.schema";

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

export type CartItemWithVariant = CartItem & {
  variant: ProductVariant & {
    prices: Price[];
    images: ProductVariantImage[];
  };
};

export type CartWithItems = Cart & {
  items: CartItemWithVariant[];
};
