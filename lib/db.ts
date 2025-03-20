// Import prisma setup first to ensure correct config
import "./prisma-setup";
// Import fix-prisma-protocol to fix the 'must start with protocol prisma://' error
require("../scripts/fix-prisma-protocol");
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

// Always use the real database connection
// We're removing the mock client for static builds
console.log("[db.ts] Using real database connection for all environments");

// Ensure we're using the DIRECT_URL if it exists (important for Vercel)
if (process.env.DIRECT_URL && isStaticBuild) {
  console.log("[db.ts] Using DIRECT_URL for database connection in Vercel");
  databaseUrl = process.env.DIRECT_URL;
}

console.log(
  "[db.ts] Database connection using URL:",
  databaseUrl.includes("@")
    ? databaseUrl.split("@")[1]
    : databaseUrl.split("://")[0]
);

// Create a real PrismaClient - no more mock client for static builds
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

// Only store the client in global scope if not in production
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
