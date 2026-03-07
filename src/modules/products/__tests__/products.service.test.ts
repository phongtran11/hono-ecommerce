import { describe, it, expect, vi, beforeEach } from "vitest";
import * as productsService from "../products.service";
import * as productsRepository from "../products.repository";
import { NotFoundError } from "@/utils/errors";

vi.mock("../products.repository");

const mockDb = {} as any;

const validInput = {
  name: "Test Product",
  description: "A test product",
  vendorId: "00000000-0000-0000-0000-000000000001",
  categoryId: "00000000-0000-0000-0000-000000000002",
  variants: [
    {
      name: "Default",
      stock: 10,
      prices: [{ name: "Default", price: 9.99 }],
    },
  ],
};

const mockVendor = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Test Vendor",
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockCategory = {
  id: "00000000-0000-0000-0000-000000000002",
  name: "Test Category",
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe("productsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createProduct", () => {
    it("should throw NotFoundError when vendor does not exist", async () => {
      vi.mocked(productsRepository.findVendorById).mockResolvedValue(
        undefined,
      );

      await expect(
        productsService.createProduct(mockDb, validInput),
      ).rejects.toThrow(NotFoundError);

      await expect(
        productsService.createProduct(mockDb, validInput),
      ).rejects.toThrow("Vendor not found");
    });

    it("should throw NotFoundError when category does not exist", async () => {
      vi.mocked(productsRepository.findVendorById).mockResolvedValue(
        mockVendor,
      );
      vi.mocked(productsRepository.findCategoryById).mockResolvedValue(
        undefined,
      );

      await expect(
        productsService.createProduct(mockDb, validInput),
      ).rejects.toThrow("Category not found");
    });

    it("should create product when vendor and category exist", async () => {
      vi.mocked(productsRepository.findVendorById).mockResolvedValue(
        mockVendor,
      );
      vi.mocked(productsRepository.findCategoryById).mockResolvedValue(
        mockCategory,
      );

      const mockProduct = {
        id: "p1",
        name: "Test Product",
        description: "A test product",
        vendorId: mockVendor.id,
        categoryId: mockCategory.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        variants: [],
      };
      vi.mocked(productsRepository.createProduct).mockResolvedValue(
        mockProduct,
      );

      const result = await productsService.createProduct(mockDb, validInput);

      expect(result).toEqual({
        success: true,
        status: 201,
        data: mockProduct,
      });
      expect(productsRepository.createProduct).toHaveBeenCalledOnce();
    });
  });

  describe("getProductById", () => {
    it("should throw NotFoundError when product does not exist", async () => {
      vi.mocked(productsRepository.findProductById).mockResolvedValue(
        undefined,
      );

      await expect(
        productsService.getProductById(mockDb, "nonexistent-id"),
      ).rejects.toThrow(NotFoundError);
    });

    it("should return product when found", async () => {
      const mockProduct = {
        id: "p1",
        name: "Test",
        description: "Test",
        vendorId: "v1",
        categoryId: "c1",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        variants: [],
        vendor: mockVendor,
        category: mockCategory,
      };
      vi.mocked(productsRepository.findProductById).mockResolvedValue(
        mockProduct,
      );

      const result = await productsService.getProductById(mockDb, "p1");

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProduct);
    });
  });

  describe("getProducts", () => {
    it("should return paginated products", async () => {
      vi.mocked(productsRepository.findProducts).mockResolvedValue([]);
      vi.mocked(productsRepository.countProducts).mockResolvedValue(0);

      const result = await productsService.getProducts(mockDb, {
        page: 1,
        limit: 20,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });
    });

    it("should pass categoryId filter to repository", async () => {
      vi.mocked(productsRepository.findProducts).mockResolvedValue([]);
      vi.mocked(productsRepository.countProducts).mockResolvedValue(0);

      await productsService.getProducts(mockDb, {
        page: 1,
        limit: 10,
        categoryId: "cat-1",
      });

      expect(productsRepository.findProducts).toHaveBeenCalledWith(mockDb, {
        categoryId: "cat-1",
        limit: 10,
        offset: 0,
      });
      expect(productsRepository.countProducts).toHaveBeenCalledWith(mockDb, {
        categoryId: "cat-1",
      });
    });
  });
});
