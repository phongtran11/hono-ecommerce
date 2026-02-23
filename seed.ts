import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { products } from "./src/db/schema";

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql);

  console.log("🌱 Seeding products...");

  await db.insert(products).values([
    {
      name: "Wireless Noise-Cancelling Headphones",
      description:
        "Premium over-ear headphones with active noise cancellation and 30-hour battery life.",
      price: "299.99",
      image: "https://placehold.co/400x400?text=Headphones",
      category: "Electronics",
      stock: 50,
    },
    {
      name: "Mechanical Keyboard",
      description:
        "RGB backlit mechanical keyboard with hot-swappable switches.",
      price: "149.99",
      image: "https://placehold.co/400x400?text=Keyboard",
      category: "Electronics",
      stock: 120,
    },
    {
      name: "Ergonomic Office Chair",
      description:
        "Adjustable lumbar support, breathable mesh back, and 4D armrests.",
      price: "499.99",
      image: "https://placehold.co/400x400?text=Chair",
      category: "Furniture",
      stock: 30,
    },
    {
      name: 'Ultra-Wide Monitor 34"',
      description:
        "34-inch curved ultra-wide QHD monitor with USB-C connectivity.",
      price: "599.99",
      image: "https://placehold.co/400x400?text=Monitor",
      category: "Electronics",
      stock: 25,
    },
    {
      name: "Standing Desk Converter",
      description:
        "Height-adjustable sit-stand desk riser with dual monitor support.",
      price: "229.99",
      image: "https://placehold.co/400x400?text=Desk",
      category: "Furniture",
      stock: 40,
    },
  ]);

  console.log("✅ Seeding complete!");
}

seed().catch(console.error);
