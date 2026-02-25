import { z } from "zod";

// ── Schema con cho từng price ─────────────────────────────
const priceItemSchema = z.object({
  name: z.string().min(1, "Price name is required"),
  price: z.number().positive("Price must be greater than 0"),
});

// ── Schema con cho từng image ─────────────────────────────
const imageItemSchema = z.object({
  imagePath: z.string().min(1, "Image path is required"),
});

// ── Schema con cho từng variant ───────────────────────────
const variantItemSchema = z.object({
  name: z.string().min(1, "Variant name is required"),
  stock: z.number().int().min(0, "Stock must be at least 0"),
  prices: z.array(priceItemSchema).min(1, "At least one price is required"),
  images: z.array(imageItemSchema).optional(),
});

// ── Schema chính cho create product ───────────────────────
export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Product description is required"),
  vendorId: z.string().uuid("Invalid vendor ID"),
  categoryId: z.string().uuid("Invalid category ID"),
  variants: z
    .array(variantItemSchema)
    .min(1, "At least one variant is required"),
});

export const getProductsSchema = z.object({
  category: z.string().optional(),
});
