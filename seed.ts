import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  categories,
  vendors,
  products,
  productVariants,
  productVariantImages,
  prices,
} from "./src/db/schema";

type SeedProduct = {
  name: string;
  description: string;
  vendorName: string;
  categoryName: string;
  variants: {
    name: string;
    stock: number;
    prices: { name: string; price: number }[];
    images?: { imageUrl: string }[];
  }[];
};

const seedProducts: SeedProduct[] = [
  {
    name: "Dầu nhớt Yoko 10W-40",
    description:
      "Dầu nhớt Yoko tổng hợp 10W-40, dành cho xe máy 4 thì, bảo vệ động cơ tối ưu",
    vendorName: "Yoko",
    categoryName: "Dầu nhớt",
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
    vendorName: "Castrol",
    categoryName: "Dầu nhớt",
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
    vendorName: "Motul",
    categoryName: "Dầu nhớt",
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
    vendorName: "Sonax",
    categoryName: "Nước rửa xe",
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
    vendorName: "Michelin",
    categoryName: "Vỏ xe",
    variants: [
      {
        name: "90/90-14 (bánh trước)",
        stock: 80,
        prices: [
          { name: "Giá bán lẻ", price: 750000 },
          { name: "Giá bán sỉ", price: 650000 },
          { name: "Giá nhập", price: 520000 },
        ],
        images: [
          { imageUrl: "products/michelin/city-grip2-90-90-14.jpg" },
        ],
      },
      {
        name: "100/90-14 (bánh sau)",
        stock: 80,
        prices: [
          { name: "Giá bán lẻ", price: 850000 },
          { name: "Giá bán sỉ", price: 740000 },
          { name: "Giá nhập", price: 600000 },
        ],
        images: [
          { imageUrl: "products/michelin/city-grip2-100-90-14.jpg" },
        ],
      },
      {
        name: "120/70-14 (bánh sau lớn)",
        stock: 40,
        prices: [
          { name: "Giá bán lẻ", price: 1050000 },
          { name: "Giá bán sỉ", price: 920000 },
          { name: "Giá nhập", price: 750000 },
        ],
        images: [
          { imageUrl: "products/michelin/city-grip2-120-70-14.jpg" },
        ],
      },
    ],
  },
];

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql);

  console.log("🌱 Seeding categories...");
  const insertedCategories = await db
    .insert(categories)
    .values([
      { name: "Dầu nhớt" },
      { name: "Nước rửa xe" },
      { name: "Vỏ xe" },
      { name: "Phụ kiện" },
    ])
    .returning({ id: categories.id, name: categories.name });
  console.log("✅ Categories:", insertedCategories.map((c) => c.name));

  console.log("🌱 Seeding vendors...");
  const insertedVendors = await db
    .insert(vendors)
    .values([
      { name: "Yoko" },
      { name: "Castrol" },
      { name: "Motul" },
      { name: "Sonax" },
      { name: "Michelin" },
    ])
    .returning({ id: vendors.id, name: vendors.name });
  console.log("✅ Vendors:", insertedVendors.map((v) => v.name));

  const categoryMap = new Map(insertedCategories.map((c) => [c.name, c.id]));
  const vendorMap = new Map(insertedVendors.map((v) => [v.name, v.id]));

  console.log("🌱 Seeding products...");
  for (const p of seedProducts) {
    const vendorId = vendorMap.get(p.vendorName);
    const categoryId = categoryMap.get(p.categoryName);
    if (!vendorId || !categoryId) {
      console.error(`Missing vendor/category for "${p.name}", skipping`);
      continue;
    }

    const [product] = await db
      .insert(products)
      .values({
        name: p.name,
        description: p.description,
        vendorId,
        categoryId,
      })
      .returning({ id: products.id, name: products.name });

    for (const v of p.variants) {
      const [variant] = await db
        .insert(productVariants)
        .values({
          name: v.name,
          stock: v.stock,
          productId: product.id,
        })
        .returning({ id: productVariants.id });

      await db.insert(prices).values(
        v.prices.map((pr) => ({
          name: pr.name,
          price: pr.price.toFixed(2),
          variantId: variant.id,
        })),
      );

      if (v.images?.length) {
        await db.insert(productVariantImages).values(
          v.images.map((img) => ({
            imageUrl: img.imageUrl,
            variantId: variant.id,
          })),
        );
      }
    }

    console.log(`  ✅ ${product.name} (${p.variants.length} variants)`);
  }

  console.log("🎉 Seeding complete!");
}

seed().catch((err) => {
  console.error("❌ Seeding failed:");
  console.error(err);
  process.exit(1);
});
