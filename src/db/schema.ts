import {
  pgTable,
  text,
  numeric,
  integer,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// ── Users ───────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Refresh Tokens ──────────────────────────────────────────
export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  token: text("token").notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Vendors ─────────────────────────────────────────────────
export const vendors = pgTable("vendors", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Products ────────────────────────────────────────────────
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  image: text("image").notNull(),
  category: text("category").notNull(),
});

// ── Product Vendors (stock per vendor) ──────────────────────
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

// ── Orders ──────────────────────────────────────────────────
export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Order Items ─────────────────────────────────────────────
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

// ── Carts ───────────────────────────────────────────────────
export const carts = pgTable("carts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Cart Items ──────────────────────────────────────────────
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
