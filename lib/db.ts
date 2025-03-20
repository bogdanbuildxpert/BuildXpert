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

// Check if we're in a build or export environment
const isStaticBuild =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.VERCEL_ENV === "production" ||
  (process.env.NODE_ENV === "production" && process.env.VERCEL);

// Create a mock Prisma client or use the real one
export const prisma = isStaticBuild
  ? createMockPrismaClient()
  : globalForPrisma.prisma ||
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

// Only store the client in global scope if not in production
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Create a mock Prisma client that returns empty data for static generation
function createMockPrismaClient() {
  console.log("[db.ts] Using mock Prisma client for static build");

  // This is a simple mock that returns empty arrays or nulls
  const mockClient = {
    user: {
      findUnique: async () => null,
      findFirst: async () => null,
      findMany: async () => [],
      create: async () => ({}),
      update: async () => ({}),
      delete: async () => ({}),
      count: async () => 0,
    },
    message: {
      findUnique: async () => null,
      findFirst: async () => null,
      findMany: async () => [],
      create: async () => ({}),
      update: async () => ({}),
      delete: async () => ({}),
      count: async () => 0,
    },
    job: {
      findUnique: async () => null,
      findFirst: async () => null,
      findMany: async () => [],
      create: async () => ({}),
      update: async () => ({}),
      delete: async () => ({}),
      count: async () => 0,
    },
    // Add other models as needed
    $connect: async () => {},
    $disconnect: async () => {},
  };

  return mockClient as unknown as PrismaClient;
}

export default prisma;
