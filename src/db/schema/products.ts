import {
  pgTable,
  text,
  numeric,
  integer,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const vendors = pgTable("vendors", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  image: text("image").notNull(),
  category: text("category").notNull(),
});

export const productVendors = pgTable("product_vendors", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  vendorId: uuid("vendor_id")
    .notNull()
    .references(() => vendors.id),
  stock: integer("stock").notNull().default(0),
});
