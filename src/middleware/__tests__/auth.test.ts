import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import type { Env } from "@/types";
import { authMiddleware } from "../auth";

vi.mock("hono/jwt", () => ({
  sign: vi.fn().mockResolvedValue("new-access-token"),
  verify: vi.fn(),
}));

import { verify, sign } from "hono/jwt";

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
};

function createApp(db: any) {
  const app = new Hono<Env>();

  app.use("*", async (c, next) => {
    c.set("db", db);
    await next();
  });

  app.use("*", authMiddleware);

  app.get("/protected", (c) => {
    const payload = c.get("jwtPayload");
    return c.json({ ok: true, payload });
  });

  return app;
}

const ENV_BINDINGS = {
  JWT_SECRET: "test-jwt-secret",
  DATABASE_URL: "test-db-url",
  ENVIRONMENT: "test",
};

function requestWithCookies(
  app: Hono<Env>,
  cookies: Record<string, string> = {},
) {
  const cookieHeader = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");

  return app.request(
    "/protected",
    { headers: cookieHeader ? { Cookie: cookieHeader } : {} },
    ENV_BINDINGS,
  );
}

describe("authMiddleware", () => {
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = {
      query: { refreshTokens: { findFirst: vi.fn() } },
      delete: vi.fn().mockReturnValue({ where: vi.fn() }),
    };
  });

  it("should return 401 when no cookies are present", async () => {
    const app = createApp(mockDb);
    const res = await requestWithCookies(app);

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({
      success: false,
      message: "Unauthorized",
    });
  });

  it("should proceed when access token is valid", async () => {
    vi.mocked(verify).mockResolvedValue({
      sub: mockUser.id,
      email: mockUser.email,
    });

    const app = createApp(mockDb);
    const res = await requestWithCookies(app, {
      access_token: "valid-at",
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.payload).toEqual({
      sub: mockUser.id,
      email: mockUser.email,
    });
    expect(verify).toHaveBeenCalledWith("valid-at", "test-jwt-secret", "HS256");
  });

  it("should return 401 when access token is invalid and no refresh token", async () => {
    vi.mocked(verify).mockRejectedValue(new Error("token expired"));

    const app = createApp(mockDb);
    const res = await requestWithCookies(app, {
      access_token: "expired-at",
    });

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({
      success: false,
      message: "Unauthorized",
    });
  });

  it("should return 401 when refresh token not found in DB", async () => {
    vi.mocked(verify).mockRejectedValue(new Error("token expired"));
    mockDb.query.refreshTokens.findFirst.mockResolvedValue(undefined);

    const app = createApp(mockDb);
    const res = await requestWithCookies(app, {
      access_token: "expired-at",
      refresh_token: "unknown-rt",
    });

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({
      success: false,
      message: "Unauthorized",
    });
  });

  it("should return 401 and delete token when refresh token is expired", async () => {
    vi.mocked(verify).mockRejectedValue(new Error("token expired"));

    const expiredRecord = {
      id: "rt-1",
      token: "expired-rt",
      expiresAt: new Date(Date.now() - 1000),
      user: mockUser,
    };
    mockDb.query.refreshTokens.findFirst.mockResolvedValue(expiredRecord);

    const mockWhere = vi.fn();
    mockDb.delete.mockReturnValue({ where: mockWhere });

    const app = createApp(mockDb);
    const res = await requestWithCookies(app, {
      refresh_token: "expired-rt",
    });

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({
      success: false,
      message: "Unauthorized (Session Expired)",
    });
    expect(mockDb.delete).toHaveBeenCalled();
  });

  it("should mint new access token and proceed when refresh token is valid", async () => {
    vi.mocked(verify).mockRejectedValue(new Error("token expired"));

    const validRecord = {
      id: "rt-1",
      token: "valid-rt",
      expiresAt: new Date(Date.now() + 60_000),
      user: mockUser,
    };
    mockDb.query.refreshTokens.findFirst.mockResolvedValue(validRecord);

    const app = createApp(mockDb);
    const res = await requestWithCookies(app, {
      access_token: "expired-at",
      refresh_token: "valid-rt",
    });

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.payload).toEqual({
      sub: mockUser.id,
      email: mockUser.email,
    });

    expect(sign).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: mockUser.id,
        email: mockUser.email,
      }),
      "test-jwt-secret",
    );

    const setCookieHeader = res.headers.get("set-cookie");
    expect(setCookieHeader).toContain("access_token=new-access-token");
    expect(setCookieHeader).toContain("HttpOnly");
    expect(setCookieHeader).toContain("Path=/");
    expect(setCookieHeader).toContain("SameSite=Lax");
  });
});
