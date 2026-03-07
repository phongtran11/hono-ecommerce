import http from "k6/http";
import { check, sleep } from "k6";

const CLOUD = "https://hono-ecommerce.phong-tran-private.workers.dev";
const BASE_URL = CLOUD;

// ── Seeded IDs ──────────────────────────────────────────────
const CATEGORIES = {
  dauNhot: "2ae21d70-fa76-46e9-9f9c-ce4048d80eef",
  nuocRuaXe: "d25f4d7d-fae2-41e1-ad13-b09ac5904af4",
  voXe: "9fc67180-b91e-4abe-b5db-3cb931b6ee3b",
  phuKien: "76dc7545-8850-47dd-99bf-dfb2ed470f31",
};

const VENDORS = {
  yoko: "91d0765f-752f-4978-84ae-1e698f21065d",
  castrol: "9e7f8e63-aa49-45dd-b606-4493828a3fa4",
  motul: "be1aff27-2725-4390-b7b8-7e28450f408b",
  sonax: "3cbdf866-d87a-4935-b052-0c337974799c",
  michelin: "747120cd-7960-4899-a64e-08281314d430",
};

export const options = {
  vus: 10,
  iterations: 50,
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.01"],
  },
};

const products = [
  {
    name: "Dầu nhớt Yoko 10W-40",
    description:
      "Dầu nhớt Yoko tổng hợp 10W-40, dành cho xe máy 4 thì, bảo vệ động cơ tối ưu",
    vendorId: VENDORS.yoko,
    categoryId: CATEGORIES.dauNhot,
    variants: [
      {
        name: "Chai 0.8L",
        stock: 200,
        prices: [
          { name: "Giá bán lẻ", price: 65000 },
          { name: "Giá bán sỉ", price: 55000 },
          { name: "Giá nhập", price: 42000 },
        ],
        images: [
          { imageUrl: "products/yoko/10w40-0.8l-front.jpg" },
          { imageUrl: "products/yoko/10w40-0.8l-back.jpg" },
        ],
      },
      {
        name: "Chai 1L",
        stock: 150,
        prices: [
          { name: "Giá bán lẻ", price: 80000 },
          { name: "Giá bán sỉ", price: 68000 },
          { name: "Giá nhập", price: 52000 },
        ],
        images: [{ imageUrl: "products/yoko/10w40-1l-front.jpg" }],
      },
    ],
  },
  {
    name: "Dầu nhớt Castrol Power 1 10W-40",
    description:
      "Dầu nhớt Castrol Power 1 tổng hợp, công nghệ Power Release giúp tăng tốc nhanh hơn",
    vendorId: VENDORS.castrol,
    categoryId: CATEGORIES.dauNhot,
    variants: [
      {
        name: "Chai 0.8L",
        stock: 300,
        prices: [
          { name: "Giá bán lẻ", price: 85000 },
          { name: "Giá bán sỉ", price: 72000 },
          { name: "Giá nhập", price: 58000 },
        ],
        images: [{ imageUrl: "products/castrol/power1-0.8l.jpg" }],
      },
      {
        name: "Chai 1L",
        stock: 250,
        prices: [
          { name: "Giá bán lẻ", price: 105000 },
          { name: "Giá bán sỉ", price: 90000 },
          { name: "Giá nhập", price: 72000 },
        ],
        images: [{ imageUrl: "products/castrol/power1-1l.jpg" }],
      },
      {
        name: "Thùng 12 chai 1L",
        stock: 50,
        prices: [
          { name: "Giá bán lẻ", price: 1200000 },
          { name: "Giá bán sỉ", price: 1020000 },
          { name: "Giá nhập", price: 840000 },
        ],
        images: [{ imageUrl: "products/castrol/power1-thung-12.jpg" }],
      },
    ],
  },
  {
    name: "Dầu nhớt Motul 7100 10W-50",
    description:
      "Dầu nhớt Motul 7100 tổng hợp toàn phần, tiêu chuẩn Ester cho xe phân khối lớn",
    vendorId: VENDORS.motul,
    categoryId: CATEGORIES.dauNhot,
    variants: [
      {
        name: "Chai 1L",
        stock: 120,
        prices: [
          { name: "Giá bán lẻ", price: 280000 },
          { name: "Giá bán sỉ", price: 245000 },
          { name: "Giá nhập", price: 200000 },
        ],
        images: [
          { imageUrl: "products/motul/7100-1l-front.jpg" },
          { imageUrl: "products/motul/7100-1l-side.jpg" },
        ],
      },
      {
        name: "Chai 4L",
        stock: 40,
        prices: [
          { name: "Giá bán lẻ", price: 1050000 },
          { name: "Giá bán sỉ", price: 920000 },
          { name: "Giá nhập", price: 780000 },
        ],
        images: [{ imageUrl: "products/motul/7100-4l.jpg" }],
      },
    ],
  },
  {
    name: "Nước rửa xe bọt tuyết Sonax",
    description:
      "Dung dịch rửa xe bọt tuyết Sonax đậm đặc, tỷ lệ pha 1:50, an toàn cho sơn xe",
    vendorId: VENDORS.sonax,
    categoryId: CATEGORIES.nuocRuaXe,
    variants: [
      {
        name: "Chai 1L",
        stock: 500,
        prices: [
          { name: "Giá bán lẻ", price: 120000 },
          { name: "Giá bán sỉ", price: 95000 },
          { name: "Giá nhập", price: 75000 },
        ],
        images: [{ imageUrl: "products/sonax/bot-tuyet-1l.jpg" }],
      },
      {
        name: "Can 5L",
        stock: 100,
        prices: [
          { name: "Giá bán lẻ", price: 450000 },
          { name: "Giá bán sỉ", price: 380000 },
          { name: "Giá nhập", price: 300000 },
        ],
        images: [{ imageUrl: "products/sonax/bot-tuyet-5l.jpg" }],
      },
    ],
  },
  {
    name: "Vỏ xe Michelin City Grip 2",
    description:
      "Vỏ xe Michelin City Grip 2, bám đường tốt trên mọi điều kiện thời tiết, độ bền cao",
    vendorId: VENDORS.michelin,
    categoryId: CATEGORIES.voXe,
    variants: [
      {
        name: "90/90-14 (bánh trước)",
        stock: 80,
        prices: [
          { name: "Giá bán lẻ", price: 750000 },
          { name: "Giá bán sỉ", price: 650000 },
          { name: "Giá nhập", price: 520000 },
        ],
        images: [{ imageUrl: "products/michelin/city-grip2-90-90-14.jpg" }],
      },
      {
        name: "100/90-14 (bánh sau)",
        stock: 80,
        prices: [
          { name: "Giá bán lẻ", price: 850000 },
          { name: "Giá bán sỉ", price: 740000 },
          { name: "Giá nhập", price: 600000 },
        ],
        images: [{ imageUrl: "products/michelin/city-grip2-100-90-14.jpg" }],
      },
      {
        name: "120/70-14 (bánh sau lớn)",
        stock: 40,
        prices: [
          { name: "Giá bán lẻ", price: 1050000 },
          { name: "Giá bán sỉ", price: 920000 },
          { name: "Giá nhập", price: 750000 },
        ],
        images: [{ imageUrl: "products/michelin/city-grip2-120-70-14.jpg" }],
      },
    ],
  },
];

export default function () {
  const product = products[__ITER % products.length];

  const res = http.post(`${BASE_URL}/api/products`, JSON.stringify(product), {
    headers: { "Content-Type": "application/json" },
  });

  check(res, {
    "status is 201": (r) => r.status === 201,
    "response has success": (r) => r.json("success") === true,
    "response has product id": (r) => r.json("data.id") !== undefined,
  });

  sleep(0.5);
}
