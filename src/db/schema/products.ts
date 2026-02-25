import { relations } from "drizzle-orm";
import { pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { auditColumns } from "./common";
import { vendors } from "./vendors";
import { categories } from "./categories";
import { productVariants } from "./product-variants";

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  vendorId: uuid("vendor_id")
    .notNull()
    .references(() => vendors.id),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id),
  ...auditColumns,
});

export type Product = typeof products.$inferSelect;

export const productRelations = relations(products, ({ many, one }) => ({
  variants: many(productVariants),
  vendor: one(vendors, {
    fields: [products.vendorId],
    references: [vendors.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));
