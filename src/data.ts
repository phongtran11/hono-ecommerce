import type { Product, Order } from "./types";

export const products: Product[] = [
  {
    id: "1",
    name: "Wireless Noise-Cancelling Headphones",
    description:
      "Premium over-ear headphones with active noise cancellation and 30-hour battery life.",
    price: 299.99,
    image: "https://placehold.co/400x400?text=Headphones",
    category: "Electronics",
    stock: 50,
  },
  {
    id: "2",
    name: "Mechanical Keyboard",
    description: "RGB backlit mechanical keyboard with hot-swappable switches.",
    price: 149.99,
    image: "https://placehold.co/400x400?text=Keyboard",
    category: "Electronics",
    stock: 120,
  },
  {
    id: "3",
    name: "Ergonomic Office Chair",
    description:
      "Adjustable lumbar support, breathable mesh back, and 4D armrests.",
    price: 499.99,
    image: "https://placehold.co/400x400?text=Chair",
    category: "Furniture",
    stock: 30,
  },
  {
    id: "4",
    name: 'Ultra-Wide Monitor 34"',
    description:
      "34-inch curved ultra-wide QHD monitor with USB-C connectivity.",
    price: 599.99,
    image: "https://placehold.co/400x400?text=Monitor",
    category: "Electronics",
    stock: 25,
  },
  {
    id: "5",
    name: "Standing Desk Converter",
    description:
      "Height-adjustable sit-stand desk riser with dual monitor support.",
    price: 229.99,
    image: "https://placehold.co/400x400?text=Desk",
    category: "Furniture",
    stock: 40,
  },
];

export const orders: Order[] = [];

let orderIdCounter = 1;

export function generateOrderId(): string {
  return `ORD-${String(orderIdCounter++).padStart(5, "0")}`;
}
