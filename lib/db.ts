import { PrismaClient } from "@prisma/client";

// Import runtime configuration
require("./prisma-config");

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Make sure we're using the correct DATABASE_URL
const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://buildxpertuser:Madalina123@178.62.45.226:5432/buildxpert";

console.log(
  "[db.ts] Database connection using URL protocol:",
  databaseUrl.split(":")[0]
);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
