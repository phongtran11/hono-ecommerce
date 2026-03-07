import type {
  Order,
  OrderItem,
  ProductVariant,
  Price,
} from "@/db/schema";

export type OrderItemWithVariant = OrderItem & {
  variant: ProductVariant & {
    prices: Price[];
  };
};

export type OrderWithItems = Order & {
  items: OrderItemWithVariant[];
};
