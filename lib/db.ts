import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Standard Next.js singleton pattern — avoids exhausting Postgres
// connections from a new PrismaClient being created on every hot-reload
// in dev. Prisma 7 requires an explicit driver adapter (schema.prisma no
// longer carries the connection URL — see prisma.config.ts for the
// Migrate CLI's copy of it).
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
