import { pgTable, integer, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { products, vendors } from "./products";

export const carts = pgTable("carts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cartItems = pgTable("cart_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  cartId: uuid("cart_id")
    .notNull()
    .references(() => carts.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  vendorId: uuid("vendor_id")
    .notNull()
    .references(() => vendors.id),
  quantity: integer("quantity").notNull().default(1),
});
