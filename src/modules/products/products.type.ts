import type { Response } from "@/types";
import type {
  Product,
  ProductVariant,
  ProductVariantImage,
  Price,
} from "@/db/schema";
import type { z } from "zod";
import type { createProductSchema } from "./schemas/products.schema";

export type CreateProductInput = z.infer<typeof createProductSchema>;

export type PreparedProductData = {
  product: {
    name: string;
    description: string;
    vendorId: string;
    categoryId: string;
  };
  variants: { name: string; stock: number }[];
  pricesByVariant: { name: string; price: string }[][];
  imagesByVariant: { imagePath: string }[][];
};

export type VariantWithDetails = ProductVariant & {
  prices: Price[];
  images: ProductVariantImage[];
};

export type ProductWithVariants = Product & {
  variants: VariantWithDetails[];
};

export type CreateProductResponse = Response<ProductWithVariants>;
