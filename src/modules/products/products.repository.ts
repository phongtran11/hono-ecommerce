import type { DB } from "@/db";
import {
  products,
  productVariants,
  productVariantImages,
  prices,
} from "@/db/schema";
import type {
  PreparedProductData,
  ProductWithVariants,
  VariantWithDetails,
} from "./products.type";

export async function createProduct(
  db: DB,
  data: PreparedProductData,
): Promise<ProductWithVariants> {
  return await db.transaction(async (tx) => {
    // 1. Insert product
    const [product] = await tx
      .insert(products)
      .values(data.product)
      .returning();

    // 2. Batch insert all variants
    const insertedVariants = await tx
      .insert(productVariants)
      .values(
        data.variants.map((v) => ({
          ...v,
          productId: product.id,
        })),
      )
      .returning();

    // 3. Batch insert all prices
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

    // 4. Batch insert all images (if any)
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

    // 5. Assemble result
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
