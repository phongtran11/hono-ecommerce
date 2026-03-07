import { hashPassword, verifyPassword } from "@/utils/password";
import { sign } from "hono/jwt";
import { AT_EXPIRES_IN_SEC, RT_EXPIRES_IN_SEC } from "./auth.constant";
import { DB } from "@/db";
import * as authRepository from "./auth.repository";
import type { AuthResponse } from "./auth.type";

export async function createAuthCookies(
  db: DB,
  secret: string,
  user: { id: string; email: string },
): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  // 1. Create short-lived Access Token
  const accessToken = await sign(
    {
      sub: user.id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + AT_EXPIRES_IN_SEC,
    },
    secret,
  );

  // 2. Create long-lived Refresh Token
  const refreshToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + RT_EXPIRES_IN_SEC * 1000);

  // Store RT in database
  await authRepository.saveRefreshToken(db, refreshToken, user.id, expiresAt);

  return { accessToken, refreshToken };
}

export async function register(
  db: DB,
  email: string,
  passwordRaw: string,
  name: string,
  jwtSecret: string,
): Promise<AuthResponse> {
  // Check if user already exists
  const existing = await authRepository.findUserByEmail(db, email);

  if (existing) {
    return { success: false, status: 409, message: "Email already registered" };
  }

  // Hash password
  const { hash, salt } = await hashPassword(passwordRaw);

  const createUserAndTokensResult = await db.transaction(async (tx) => {
    const newUser = await authRepository.createUser(
      tx,
      email,
      hash,
      salt,
      name,
    );

    const tokens = await createAuthCookies(tx, jwtSecret, newUser);

    return { user: newUser, tokens };
  });

  return {
    success: true,
    status: 201,
    data: createUserAndTokensResult,
  };
}

export async function login(
  db: DB,
  email: string,
  passwordRaw: string,
  jwtSecret: string,
): Promise<AuthResponse> {
  const user = await authRepository.findUserByEmail(db, email);

  if (!user) {
    return { success: false, status: 401, message: "Invalid credentials" };
  }

  const isValid = await verifyPassword(
    passwordRaw,
    user.passwordHash,
    user.passwordSalt,
  );

  if (!isValid) {
    return { success: false, status: 401, message: "Invalid credentials" };
  }

  const loginResult = await db.transaction(async (tx) => {
    await authRepository.deleteRefreshTokensByUserId(tx, user.id);

    const tokens = await createAuthCookies(tx, jwtSecret, {
      id: user.id,
      email: user.email,
    });

    return { tokens };
  });

  return {
    success: true,
    status: 200,
    data: {
      user: { id: user.id, email: user.email, name: user.name },
      tokens: loginResult.tokens,
    },
  };
}

export async function logout(
  db: DB,
  refreshTokenCookie?: string,
): Promise<void> {
  if (refreshTokenCookie) {
    await authRepository.deleteRefreshToken(db, refreshTokenCookie);
  }
}
