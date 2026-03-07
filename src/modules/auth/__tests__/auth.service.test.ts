import { describe, it, expect, vi, beforeEach } from "vitest";
import * as authService from "../auth.service";
import * as authRepository from "../auth.repository";
import * as passwordUtil from "@/utils/password";

vi.mock("../auth.repository");
vi.mock("@/utils/password");
vi.mock("hono/jwt", () => ({
  sign: vi.fn().mockResolvedValue("mock-access-token"),
}));

const mockDb = {
  transaction: vi.fn((cb: any) => cb(mockDb)),
} as any;

const jwtSecret = "test-secret";

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  passwordHash: "hashed-pw",
  passwordSalt: "salt-value",
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockCreatedUser = {
  id: mockUser.id,
  email: mockUser.email,
  name: mockUser.name,
};

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.transaction.mockImplementation((cb: any) => cb(mockDb));
  });

  describe("register", () => {
    it("should return 409 when email already registered", async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue(mockUser);

      const result = await authService.register(
        mockDb,
        mockUser.email,
        "password123",
        mockUser.name,
        jwtSecret,
      );

      expect(result).toEqual({
        success: false,
        status: 409,
        message: "Email already registered",
      });
      expect(authRepository.createUser).not.toHaveBeenCalled();
    });

    it("should register and return tokens for new user", async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue(undefined);
      vi.mocked(passwordUtil.hashPassword).mockResolvedValue({
        hash: "hashed-pw",
        salt: "salt-value",
      });
      vi.mocked(authRepository.createUser).mockResolvedValue(mockCreatedUser);
      vi.mocked(authRepository.saveRefreshToken).mockResolvedValue(undefined);

      const result = await authService.register(
        mockDb,
        "new@example.com",
        "password123",
        "New User",
        jwtSecret,
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(201);
      expect(result.data?.user).toEqual(mockCreatedUser);
      expect(result.data?.tokens?.accessToken).toBeDefined();
      expect(result.data?.tokens?.refreshToken).toBeDefined();
      expect(authRepository.createUser).toHaveBeenCalledWith(
        mockDb,
        "new@example.com",
        "hashed-pw",
        "salt-value",
        "New User",
      );
    });
  });

  describe("login", () => {
    it("should return 401 when user not found", async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue(undefined);

      const result = await authService.login(
        mockDb,
        "unknown@example.com",
        "password123",
        jwtSecret,
      );

      expect(result).toEqual({
        success: false,
        status: 401,
        message: "Invalid credentials",
      });
    });

    it("should return 401 when password is wrong", async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue(mockUser);
      vi.mocked(passwordUtil.verifyPassword).mockResolvedValue(false);

      const result = await authService.login(
        mockDb,
        mockUser.email,
        "wrong-password",
        jwtSecret,
      );

      expect(result).toEqual({
        success: false,
        status: 401,
        message: "Invalid credentials",
      });
      expect(passwordUtil.verifyPassword).toHaveBeenCalledWith(
        "wrong-password",
        mockUser.passwordHash,
        mockUser.passwordSalt,
      );
    });

    it("should login and return tokens with valid credentials", async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue(mockUser);
      vi.mocked(passwordUtil.verifyPassword).mockResolvedValue(true);
      vi.mocked(authRepository.deleteRefreshTokensByUserId).mockResolvedValue(
        undefined,
      );
      vi.mocked(authRepository.saveRefreshToken).mockResolvedValue(undefined);

      const result = await authService.login(
        mockDb,
        mockUser.email,
        "correct-password",
        jwtSecret,
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data?.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      });
      expect(result.data?.tokens?.accessToken).toBeDefined();
      expect(result.data?.tokens?.refreshToken).toBeDefined();
      expect(
        authRepository.deleteRefreshTokensByUserId,
      ).toHaveBeenCalledWith(mockDb, mockUser.id);
    });
  });

  describe("logout", () => {
    it("should delete refresh token when cookie is provided", async () => {
      vi.mocked(authRepository.deleteRefreshToken).mockResolvedValue(
        undefined,
      );

      await authService.logout(mockDb, "rt-cookie-value");

      expect(authRepository.deleteRefreshToken).toHaveBeenCalledWith(
        mockDb,
        "rt-cookie-value",
      );
    });

    it("should do nothing when no cookie is provided", async () => {
      await authService.logout(mockDb, undefined);

      expect(authRepository.deleteRefreshToken).not.toHaveBeenCalled();
    });
  });
});
