import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { categories, vendors } from "./src/db/schema";

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

  console.log("✅ Categories:", insertedCategories);

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

  console.log("✅ Vendors:", insertedVendors);

  console.log("\n📋 Use these IDs for k6 or API testing:");
  console.log("Categories:");
  for (const c of insertedCategories) {
    console.log(`  ${c.name}: ${c.id}`);
  }
  console.log("Vendors:");
  for (const v of insertedVendors) {
    console.log(`  ${v.name}: ${v.id}`);
  }
}

seed().catch((err) => {
  console.error("❌ Seeding failed:");
  console.error(err);
  process.exit(1);
});
