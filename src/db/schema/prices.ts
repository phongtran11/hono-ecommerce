import { index, numeric, pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { auditColumns } from "./common";
import { relations } from "drizzle-orm";
import { productVariants } from "./product-variants";

export const prices = pgTable(
  "prices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id),
    ...auditColumns,
  },
  (t) => [index("prices_variant_id_idx").on(t.variantId)],
);

export type Price = typeof prices.$inferSelect;

export const priceRelations = relations(prices, ({ one }) => ({
  variant: one(productVariants, {
    fields: [prices.variantId],
    references: [productVariants.id],
  }),
}));
