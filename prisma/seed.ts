import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const db = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const hash = await bcrypt.hash("admin123", 12);

  const boss = await db.user.upsert({
    where: { email: "boss@unistocker.app" },
    update: {},
    create: { name: "Boss Admin", email: "boss@unistocker.app", password: hash, role: "BOSS" },
  });

  const categories = await Promise.all(
    ["Electronics", "Clothing", "Food & Beverages", "Office Supplies", "Hardware"].map((name) =>
      db.category.upsert({ where: { name }, update: {}, create: { name } })
    )
  );

  const products = [
    { name: "Wireless Mouse", sku: "ELEC-001", costPrice: 8.99, sellingPrice: 19.99, quantity: 50, categoryId: categories[0].id },
    { name: "USB-C Hub 7-Port", sku: "ELEC-002", costPrice: 15.0, sellingPrice: 34.99, quantity: 30, categoryId: categories[0].id },
    { name: "T-Shirt (White, M)", sku: "CLTH-001", costPrice: 4.5, sellingPrice: 12.99, quantity: 100, categoryId: categories[1].id },
    { name: "Office Chair Cushion", sku: "OFFC-001", costPrice: 9.99, sellingPrice: 24.99, quantity: 25, categoryId: categories[3].id },
    { name: "Bottled Water (24pk)", sku: "FOOD-001", costPrice: 3.99, sellingPrice: 7.99, quantity: 8, lowStockAlert: 10, categoryId: categories[2].id },
    { name: "Ballpoint Pens (Box)", sku: "OFFC-002", costPrice: 2.5, sellingPrice: 5.99, quantity: 60, categoryId: categories[3].id },
  ];

  for (const p of products) {
    const existing = await db.product.findUnique({ where: { sku: p.sku } });
    if (!existing) {
      await db.product.create({ data: { ...p, createdById: boss.id } });
    }
  }

  console.log("Seed complete!");
  console.log("Login credentials: boss@unistocker.app / admin123");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
