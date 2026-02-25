import { relations } from "drizzle-orm";
import { uuid, pgTable, varchar } from "drizzle-orm/pg-core";
import { auditColumns } from "./common";
import { products } from "./products";

export const vendors = pgTable("vendors", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  ...auditColumns,
});

export type Vendor = typeof vendors.$inferSelect;

export const vendorRelations = relations(vendors, ({ many }) => ({
  products: many(products),
}));
