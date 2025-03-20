import { PrismaClient } from "@prisma/client";

// Import runtime configuration
require("./prisma-config");

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Make sure we're using the correct DATABASE_URL
let databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://buildxpertuser:Madalina123@178.62.45.226:5432/buildxpert";

// Check if we're in a build or export environment
const isStaticBuild =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.VERCEL_ENV === "production" ||
  (process.env.NODE_ENV === "production" && process.env.VERCEL);

// Log the environment for debugging
console.log("[db.ts] Environment info:", {
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_ENV: process.env.VERCEL_ENV,
  VERCEL: process.env.VERCEL,
  NEXT_PHASE: process.env.NEXT_PHASE,
  isStaticBuild: isStaticBuild,
});

// For static builds during Vercel deployments, we'll just use a mock client
// and not try to connect to the database at all
if (isStaticBuild) {
  console.log("[db.ts] Static build detected - using mock Prisma client only");

  // Still set the correct protocol in case schema validation happens
  if (databaseUrl.startsWith("postgresql://")) {
    databaseUrl = "prisma://placeholder.prisma-data.com/?api_key=placeholder";
    console.log(
      "[db.ts] Using placeholder Prisma Accelerate URL for static build"
    );
  }
}

console.log(
  "[db.ts] Database connection using URL protocol:",
  databaseUrl.split(":")[0]
);

// Create a mock Prisma client or use the real one - ALWAYS use mock for static builds
export const prisma = isStaticBuild
  ? createMockPrismaClient() // Always use mock for static builds
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
    job: {
      findUnique: async () => null,
      findFirst: async () => null,
      findMany: async () => [],
      create: async () => ({}),
      update: async () => ({}),
      delete: async () => ({}),
      count: async () => 0,
    },
    contact: {
      findUnique: async () => null,
      findFirst: async () => null,
      findMany: async () => [],
      create: async () => ({}),
      update: async () => ({}),
      delete: async () => ({}),
      count: async () => 0,
    },
    project: {
      findUnique: async () => null,
      findFirst: async () => null,
      findMany: async () => [],
      create: async () => ({}),
      update: async () => ({}),
      delete: async () => ({}),
      count: async () => 0,
    },
    emailTemplate: {
      findUnique: async () => null,
      findFirst: async () => null,
      findMany: async () => [],
      create: async () => ({}),
      update: async () => ({}),
      delete: async () => ({}),
      count: async () => 0,
    },
    // Mock connection methods
    $connect: async () => {
      console.log(
        "[db.ts] Mock $connect called - no actual database connection"
      );
      return Promise.resolve();
    },
    $disconnect: async () => {
      console.log(
        "[db.ts] Mock $disconnect called - no actual database connection"
      );
      return Promise.resolve();
    },
    $executeRawUnsafe: async () => {
      console.log(
        "[db.ts] Mock $executeRawUnsafe called - no actual query execution"
      );
      return Promise.resolve(0);
    },
    $queryRaw: async () => {
      console.log("[db.ts] Mock $queryRaw called - no actual query execution");
      return Promise.resolve([]);
    },
  };

  return mockClient as unknown as PrismaClient;
}

export default prisma;
