import {
  index,
  integer,
  pgTable,
  text,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { auditColumns } from "./common";
import { products } from "./products";
import { relations } from "drizzle-orm";
import { prices } from "./prices";

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    stock: integer("stock").notNull().default(0),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    ...auditColumns,
  },
  (t) => [index("product_variants_product_id_idx").on(t.productId)],
);

export type ProductVariant = typeof productVariants.$inferSelect;

export const productVariantRelations = relations(
  productVariants,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
    prices: many(prices),
    images: many(productVariantImages),
  }),
);

// --- Product Variant Images ---
export const productVariantImages = pgTable(
  "product_variant_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    imageUrl: text("image_url").notNull(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id),
    ...auditColumns,
  },
  (t) => [index("product_variant_images_variant_id_idx").on(t.variantId)],
);

export type ProductVariantImage = typeof productVariantImages.$inferSelect;

export const productVariantImageRelations = relations(
  productVariantImages,
  ({ one }) => ({
    variant: one(productVariants, {
      fields: [productVariantImages.variantId],
      references: [productVariants.id],
    }),
  }),
);
