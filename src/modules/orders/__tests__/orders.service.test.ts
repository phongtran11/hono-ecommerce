import { describe, it, expect, vi, beforeEach } from "vitest";
import * as ordersService from "../orders.service";
import * as ordersRepository from "../orders.repository";
import * as cartRepository from "../../cart/cart.repository";
import { NotFoundError, ValidationError } from "@/utils/errors";

vi.mock("../orders.repository");
vi.mock("../../cart/cart.repository");

const mockDb = {} as any;
const userId = "user-1";

describe("ordersService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createOrder", () => {
    it("should throw ValidationError when cart is empty", async () => {
      vi.mocked(cartRepository.getCartWithItems).mockResolvedValue(null as any);

      await expect(
        ordersService.createOrder(mockDb, userId),
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError when cart has no items", async () => {
      vi.mocked(cartRepository.getCartWithItems).mockResolvedValue({
        id: "cart-1",
        userId,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      await expect(
        ordersService.createOrder(mockDb, userId),
      ).rejects.toThrow("Cart is empty");
    });

    it("should create order from cart items", async () => {
      vi.mocked(cartRepository.getCartWithItems).mockResolvedValue({
        id: "cart-1",
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        items: [
          {
            id: "item-1",
            cartId: "cart-1",
            variantId: "variant-1",
            quantity: 2,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            variant: {
              id: "variant-1",
              name: "Size M",
              stock: 10,
              productId: "product-1",
              createdAt: new Date(),
              updatedAt: new Date(),
              deletedAt: null,
              prices: [
                {
                  id: "price-1",
                  name: "Default",
                  price: "19.99",
                  variantId: "variant-1",
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  deletedAt: null,
                },
              ],
              images: [],
            },
          },
        ],
      });

      const mockOrder = {
        id: "order-1",
        userId,
        total: "39.98",
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        items: [],
      };
      vi.mocked(ordersRepository.createOrderInTransaction).mockResolvedValue(
        mockOrder,
      );

      const result = await ordersService.createOrder(mockDb, userId);

      expect(result.success).toBe(true);
      expect(result.status).toBe(201);
      expect(ordersRepository.createOrderInTransaction).toHaveBeenCalledWith(
        mockDb,
        userId,
        "cart-1",
        [{ variantId: "variant-1", quantity: 2, price: "19.99" }],
        "39.98",
      );
    });
  });

  describe("getOrderById", () => {
    it("should throw NotFoundError when order does not exist", async () => {
      vi.mocked(ordersRepository.findOrderById).mockResolvedValue(undefined);

      await expect(
        ordersService.getOrderById(mockDb, userId, "nonexistent"),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("getOrders", () => {
    it("should return paginated orders", async () => {
      vi.mocked(ordersRepository.findOrdersByUserId).mockResolvedValue([]);
      vi.mocked(ordersRepository.countOrdersByUserId).mockResolvedValue(0);

      const result = await ordersService.getOrders(mockDb, userId, {
        page: 1,
        limit: 20,
      });

      expect(result.success).toBe(true);
      expect(result.data.totalPages).toBe(0);
    });
  });
});
