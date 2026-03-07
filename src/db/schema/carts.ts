import { index, pgTable, integer, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { relations, sql } from "drizzle-orm";
import { auditColumns } from "./common";
import { productVariants } from "./product-variants";

export const carts = pgTable("carts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id),
  ...auditColumns,
});

export type Cart = typeof carts.$inferSelect;

export const cartRelations = relations(carts, ({ one, many }) => ({
  user: one(users, {
    fields: [carts.userId],
    references: [users.id],
  }),
  items: many(cartItems),
}));

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id),
    quantity: integer("quantity").notNull().default(1),
    ...auditColumns,
  },
  (t) => [
    index("cart_items_cart_id_idx").on(t.cartId),
    uniqueIndex("cart_items_cart_variant_active_idx")
      .on(t.cartId, t.variantId)
      .where(sql`deleted_at IS NULL`),
  ],
);

export type CartItem = typeof cartItems.$inferSelect;

export const cartItemRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  variant: one(productVariants, {
    fields: [cartItems.variantId],
    references: [productVariants.id],
  }),
}));
