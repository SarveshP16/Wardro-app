import { defineConfig, env } from "prisma/config";

/// Prisma 7 config file — holds the connection URL used by the CLI
/// (`prisma migrate dev/deploy`, `prisma studio`). The running app gets
/// its connection separately, via a driver adapter passed to the
/// PrismaClient constructor (see lib/db.ts).
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
