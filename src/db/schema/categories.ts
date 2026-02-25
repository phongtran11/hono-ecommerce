import { relations } from "drizzle-orm";
import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { auditColumns } from "./common";
import { products } from "./products";

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  ...auditColumns,
});

export type Category = typeof categories.$inferSelect;

export const categoryRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));
