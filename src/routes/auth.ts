import { Hono } from "hono";
import { sign } from "hono/jwt";
import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import { hashPassword, verifyPassword } from "../utils/password";
import type { Env } from "../types";

const authRoutes = new Hono<Env>();

// ── POST /api/auth/register ─────────────────────────────────
authRoutes.post("/register", async (c) => {
  const { email, password, name } = await c.req.json<{
    email: string;
    password: string;
    name: string;
  }>();

  if (!email || !password || !name) {
    return c.json(
      { success: false, message: "Email, password, and name are required" },
      400,
    );
  }

  const db = c.get("db");

  // Check if user already exists
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    return c.json({ success: false, message: "Email already registered" }, 409);
  }

  // Hash password
  const { hash, salt } = await hashPassword(password);

  // Insert user
  const [newUser] = await db
    .insert(users)
    .values({
      email,
      passwordHash: hash,
      passwordSalt: salt,
      name,
    })
    .returning({ id: users.id, email: users.email, name: users.name });

  // Generate JWT
  const token = await sign(
    { sub: newUser.id, email: newUser.email },
    c.env.JWT_SECRET,
  );

  return c.json(
    {
      success: true,
      data: {
        user: newUser,
        token,
      },
    },
    201,
  );
});

// ── POST /api/auth/login ────────────────────────────────────
authRoutes.post("/login", async (c) => {
  const { email, password } = await c.req.json<{
    email: string;
    password: string;
  }>();

  if (!email || !password) {
    return c.json(
      { success: false, message: "Email and password are required" },
      400,
    );
  }

  const db = c.get("db");

  // Find user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return c.json({ success: false, message: "Invalid credentials" }, 401);
  }

  // Verify password
  const isValid = await verifyPassword(
    password,
    user.passwordHash,
    user.passwordSalt,
  );

  if (!isValid) {
    return c.json({ success: false, message: "Invalid credentials" }, 401);
  }

  // Generate JWT
  const token = await sign(
    { sub: user.id, email: user.email },
    c.env.JWT_SECRET,
  );

  return c.json({
    success: true,
    data: {
      user: { id: user.id, email: user.email, name: user.name },
      token,
    },
  });
});

export { authRoutes };
