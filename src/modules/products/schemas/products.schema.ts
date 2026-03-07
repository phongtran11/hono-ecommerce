import { z } from "zod";
import { paginationSchema } from "@/utils/pagination";

const priceItemSchema = z.object({
  name: z.string().min(1, "Price name is required"),
  price: z.number().positive("Price must be greater than 0"),
});

const imageItemSchema = z.object({
  imageUrl: z.string().min(1, "Image URL is required"),
});

const variantItemSchema = z.object({
  name: z.string().min(1, "Variant name is required"),
  stock: z.number().int().min(0, "Stock must be at least 0"),
  prices: z.array(priceItemSchema).min(1, "At least one price is required"),
  images: z.array(imageItemSchema).optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Product description is required"),
  vendorId: z.string().uuid("Invalid vendor ID"),
  categoryId: z.string().uuid("Invalid category ID"),
  variants: z
    .array(variantItemSchema)
    .min(1, "At least one variant is required"),
});

export const getProductsSchema = paginationSchema.extend({
  categoryId: z.string().uuid().optional(),
});

export const productIdParamSchema = z.object({
  id: z.string().uuid("Invalid product ID"),
});
