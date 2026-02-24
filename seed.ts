import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { products, vendors, productVendors } from "./src/db/schema";

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql);

  console.log("🌱 Seeding vendors...");
  const insertedVendors = await db
    .insert(vendors)
    .values([
      { name: "TechNova Electronics" },
      { name: "ErgoComfort Furniture" },
      { name: "Global Gadgets" },
    ])
    .returning({ id: vendors.id });

  console.log("🌱 Seeding products...");
  const insertedProducts = await db
    .insert(products)
    .values([
      {
        name: "Wireless Noise-Cancelling Headphones",
        description:
          "Premium over-ear headphones with active noise cancellation and 30-hour battery life.",
        price: "299.99",
        image: "https://placehold.co/400x400?text=Headphones",
        category: "Electronics",
      },
      {
        name: "Mechanical Keyboard",
        description:
          "RGB backlit mechanical keyboard with hot-swappable switches.",
        price: "149.99",
        image: "https://placehold.co/400x400?text=Keyboard",
        category: "Electronics",
      },
      {
        name: "Ergonomic Office Chair",
        description:
          "Adjustable lumbar support, breathable mesh back, and 4D armrests.",
        price: "499.99",
        image: "https://placehold.co/400x400?text=Chair",
        category: "Furniture",
      },
      {
        name: 'Ultra-Wide Monitor 34"',
        description:
          "34-inch curved ultra-wide QHD monitor with USB-C connectivity.",
        price: "599.99",
        image: "https://placehold.co/400x400?text=Monitor",
        category: "Electronics",
      },
      {
        name: "Standing Desk Converter",
        description:
          "Height-adjustable sit-stand desk riser with dual monitor support.",
        price: "229.99",
        image: "https://placehold.co/400x400?text=Desk",
        category: "Furniture",
      },
    ])
    .returning({ id: products.id, name: products.name });

  console.log("🌱 Seeding product quantities per vendor...");

  // Assign stock to product-vendor combinations
  const pvData = [];

  for (const product of insertedProducts) {
    if (product.name.includes("Chair") || product.name.includes("Desk")) {
      // Furniture vendor only
      pvData.push({
        productId: product.id,
        vendorId: insertedVendors[1].id,
        stock: Math.floor(Math.random() * 50) + 10,
      });
    } else {
      // Electronics vendors
      pvData.push({
        productId: product.id,
        vendorId: insertedVendors[0].id, // TechNova
        stock: Math.floor(Math.random() * 30) + 5,
      });
      pvData.push({
        productId: product.id,
        vendorId: insertedVendors[2].id, // Global Gadgets
        stock: Math.floor(Math.random() * 80) + 15,
      });
    }
  }

  await db.insert(productVendors).values(pvData);

  console.log("✅ Seeding complete!");
}

seed().catch((err) => {
  console.error("❌ Seeding failed:");
  console.error(err);
  process.exit(1);
});
