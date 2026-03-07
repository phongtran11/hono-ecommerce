import type { DB } from "@/db";
import * as productsRepository from "./products.repository";
import { NotFoundError } from "@/utils/errors";
import { createPaginatedResponse } from "@/utils/pagination";
import type {
  CreateProductInput,
  CreateProductResponse,
  PreparedProductData,
  GetProductsInput,
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
        imageUrl: img.imageUrl,
      })),
    ),
  };
}

export async function createProduct(
  db: DB,
  input: CreateProductInput,
): Promise<CreateProductResponse> {
  const vendor = await productsRepository.findVendorById(db, input.vendorId);
  if (!vendor) {
    throw new NotFoundError("Vendor not found");
  }

  const category = await productsRepository.findCategoryById(
    db,
    input.categoryId,
  );
  if (!category) {
    throw new NotFoundError("Category not found");
  }

  const data = prepareProductData(input);
  const product = await productsRepository.createProduct(db, data);

  return {
    success: true,
    status: 201,
    data: product,
  };
}

export async function getProducts(db: DB, input: GetProductsInput) {
  const offset = (input.page - 1) * input.limit;

  const [products, total] = await Promise.all([
    productsRepository.findProducts(db, {
      categoryId: input.categoryId,
      limit: input.limit,
      offset,
    }),
    productsRepository.countProducts(db, {
      categoryId: input.categoryId,
    }),
  ]);

  return {
    success: true as const,
    status: 200 as const,
    data: createPaginatedResponse(products, total, input.page, input.limit),
  };
}

export async function getProductById(db: DB, id: string) {
  const product = await productsRepository.findProductById(db, id);
  if (!product) {
    throw new NotFoundError("Product not found");
  }

  return {
    success: true as const,
    status: 200 as const,
    data: product,
  };
}
