import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { carts } from "./carts";
import { relations } from "drizzle-orm";
import { orders } from "./orders";
import { auditColumns } from "./common";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  name: text("name").notNull(),
  ...auditColumns,
});

export type User = typeof users.$inferSelect;

export const userRelations = relations(users, ({ many }) => ({
  refreshTokens: many(refreshTokens),
  carts: many(carts),
  orders: many(orders),
}));

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    token: text("token").notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at").notNull(),
    ...auditColumns,
  },
  (t) => [index("refresh_tokens_user_id_idx").on(t.userId)],
);

export const refreshTokenRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export type RefreshToken = typeof refreshTokens.$inferSelect;
