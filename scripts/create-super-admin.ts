import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function main() {
  const email = "superadmin@unistocker.com";
  const password = "WelcomeCEO";

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    if (!existing.isSuperAdmin) {
      await db.user.update({ where: { email }, data: { isSuperAdmin: true } });
      console.log("Existing user promoted to super admin.");
    } else {
      console.log("Super admin already exists — nothing to do.");
    }
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  await db.user.create({
    data: {
      name: "Super Admin",
      email,
      password: hash,
      role: "BOSS",
      isSuperAdmin: true,
    },
  });

  console.log("Super admin created successfully.");
  console.log(`  Email   : ${email}`);
  console.log(`  Password: ${password}`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await db.$disconnect();
    await pool.end();
  });
