import type { Response } from "@/types";
import type {
  Product,
  ProductVariant,
  ProductVariantImage,
  Price,
  Vendor,
  Category,
} from "@/db/schema";
import type { z } from "zod";
import type {
  createProductSchema,
  getProductsSchema,
} from "./schemas/products.schema";
import type { PaginatedResponse } from "@/utils/pagination";

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type GetProductsInput = z.infer<typeof getProductsSchema>;

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

export type ProductDetail = Product & {
  variants: VariantWithDetails[];
  vendor: Vendor;
  category: Category;
};

export type CreateProductResponse = Response<ProductWithVariants>;
export type GetProductsResponse = Response<PaginatedResponse<ProductDetail>>;
export type GetProductResponse = Response<ProductDetail>;
