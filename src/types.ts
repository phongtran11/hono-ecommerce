export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered";
  createdAt: string;
}

export interface Bindings {
  AI: any;
}
