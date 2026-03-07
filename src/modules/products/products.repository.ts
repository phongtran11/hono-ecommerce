import type { DB } from "@/db";
import {
  products,
  productVariants,
  productVariantImages,
  prices,
  vendors,
  categories,
} from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { notDeleted } from "@/utils/soft-delete";
import type {
  PreparedProductData,
  ProductWithVariants,
  VariantWithDetails,
} from "./products.type";

export async function findVendorById(db: DB, id: string) {
  return await db.query.vendors.findFirst({
    where: and(eq(vendors.id, id), notDeleted(vendors.deletedAt)),
  });
}

export async function findCategoryById(db: DB, id: string) {
  return await db.query.categories.findFirst({
    where: and(eq(categories.id, id), notDeleted(categories.deletedAt)),
  });
}

export async function findProducts(
  db: DB,
  opts: { categoryId?: string; limit: number; offset: number },
) {
  const conditions = [notDeleted(products.deletedAt)];
  if (opts.categoryId) {
    conditions.push(eq(products.categoryId, opts.categoryId));
  }

  return await db.query.products.findMany({
    where: and(...conditions),
    with: {
      variants: {
        where: notDeleted(productVariants.deletedAt),
        with: {
          prices: {
            where: notDeleted(prices.deletedAt),
          },
          images: {
            where: notDeleted(productVariantImages.deletedAt),
          },
        },
      },
      vendor: true,
      category: true,
    },
    limit: opts.limit,
    offset: opts.offset,
    orderBy: (products, { desc }) => [desc(products.createdAt)],
  });
}

export async function countProducts(
  db: DB,
  opts: { categoryId?: string },
) {
  const conditions = [notDeleted(products.deletedAt)];
  if (opts.categoryId) {
    conditions.push(eq(products.categoryId, opts.categoryId));
  }

  const [result] = await db
    .select({ count: count() })
    .from(products)
    .where(and(...conditions));
  return Number(result.count);
}

export async function findProductById(db: DB, id: string) {
  return await db.query.products.findFirst({
    where: and(eq(products.id, id), notDeleted(products.deletedAt)),
    with: {
      variants: {
        where: notDeleted(productVariants.deletedAt),
        with: {
          prices: {
            where: notDeleted(prices.deletedAt),
          },
          images: {
            where: notDeleted(productVariantImages.deletedAt),
          },
        },
      },
      vendor: true,
      category: true,
    },
  });
}

export async function createProduct(
  db: DB,
  data: PreparedProductData,
): Promise<ProductWithVariants> {
  return await db.transaction(async (tx) => {
    const [product] = await tx
      .insert(products)
      .values(data.product)
      .returning();

    const insertedVariants = await tx
      .insert(productVariants)
      .values(
        data.variants.map((v) => ({
          ...v,
          productId: product.id,
        })),
      )
      .returning();

    const priceValues = insertedVariants.flatMap((variant, i) =>
      data.pricesByVariant[i].map((p) => ({
        ...p,
        variantId: variant.id,
      })),
    );
    const insertedPrices = await tx
      .insert(prices)
      .values(priceValues)
      .returning();

    const imageValues = insertedVariants.flatMap((variant, i) =>
      data.imagesByVariant[i].map((img) => ({
        ...img,
        variantId: variant.id,
      })),
    );
    const insertedImages =
      imageValues.length > 0
        ? await tx.insert(productVariantImages).values(imageValues).returning()
        : [];

    const variantsWithDetails: VariantWithDetails[] = insertedVariants.map(
      (variant) => ({
        ...variant,
        prices: insertedPrices.filter((p) => p.variantId === variant.id),
        images: insertedImages.filter((img) => img.variantId === variant.id),
      }),
    );

    return { ...product, variants: variantsWithDetails };
  });
}
