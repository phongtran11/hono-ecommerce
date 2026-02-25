import { integer, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { auditColumns } from "./common";
import { products } from "./products";
import { relations } from "drizzle-orm";
import { prices } from "./prices";

// --- Product Variants ---
export const productVariants = pgTable("product_variants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  stock: integer("stock").notNull().default(0),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  ...auditColumns,
});

export type ProductVariant = typeof productVariants.$inferSelect;

export const productVariantRelations = relations(
  productVariants,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
    prices: many(productVariantPrices),
  }),
);

// --- Product Variant Prices ---
export const productVariantPrices = pgTable("product_variant_prices", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  variantId: uuid("variant_id")
    .notNull()
    .references(() => productVariants.id),
  ...auditColumns,
});

export type ProductVariantPrice = typeof productVariantPrices.$inferSelect;

export const productVariantPriceRelations = relations(
  productVariantPrices,
  ({ one, many }) => ({
    variant: one(productVariants, {
      fields: [productVariantPrices.variantId],
      references: [productVariants.id],
    }),
    prices: many(prices),
  }),
);

// --- Product Variant Images ---
export const productVariantImages = pgTable("product_variant_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  imagePath: text("image_url").notNull(),
  variantId: uuid("variant_id")
    .notNull()
    .references(() => productVariants.id),
  ...auditColumns,
});

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
