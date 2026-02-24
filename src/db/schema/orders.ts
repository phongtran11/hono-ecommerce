import {
  pgTable,
  text,
  numeric,
  integer,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { products, vendors } from "./products";

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  vendorId: uuid("vendor_id")
    .notNull()
    .references(() => vendors.id),
  quantity: integer("quantity").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
});
