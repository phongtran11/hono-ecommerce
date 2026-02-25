import type { DB } from "@/db";
import * as productsRepository from "./products.repository";
import type {
  CreateProductInput,
  CreateProductResponse,
  PreparedProductData,
} from "./products.type";

function prepareProductData(input: CreateProductInput): PreparedProductData {
  return {
    product: {
      name: input.name,
      description: input.description,
      vendorId: input.vendorId,
      categoryId: input.categoryId,
    },
    variants: input.variants.map((v) => ({
      name: v.name,
      stock: v.stock,
    })),
    pricesByVariant: input.variants.map((v) =>
      v.prices.map((p) => ({
        name: p.name,
        price: p.price.toFixed(2),
      })),
    ),
    imagesByVariant: input.variants.map((v) =>
      (v.images ?? []).map((img) => ({
        imagePath: img.imagePath,
      })),
    ),
  };
}

export async function createProduct(
  db: DB,
  input: CreateProductInput,
): Promise<CreateProductResponse> {
  const data = prepareProductData(input);

  const product = await productsRepository.createProduct(db, data);

  return {
    success: true,
    status: 201,
    data: product,
  };
}
