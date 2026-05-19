import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const g = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

function getPool() {
  if (g.pgPool) return g.pgPool;
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3, // 3 per worker process × ~3-4 workers = stays under PgBouncer pool_size:15
  });
  g.pgPool = pool;
  return pool;
}

function createPrismaClient() {
  const adapter = new PrismaPg(getPool());
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const db = g.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") g.prisma = db;
