// Import prisma-config first to ensure environment is correctly set up
import "./prisma-config";
import { PrismaClient, Prisma } from "@prisma/client";

// Add prisma to the NodeJS global type
declare global {
  var prisma: PrismaClient | undefined;
}

// Check if we're in a Vercel preview environment
const isVercelPreview = process.env.VERCEL_ENV === "preview";
const isVercelProduction =
  process.env.VERCEL === "1" && process.env.NODE_ENV === "production";
const isDataProxyEnabled =
  process.env.PRISMA_CLIENT_ENGINE_TYPE === "dataproxy";

// Log environment information
console.log(
  `[prisma.ts] Environment: ${
    isVercelProduction
      ? "Vercel Production"
      : isVercelPreview
      ? "Vercel Preview"
      : "Development/Other"
  }`
);
console.log(
  `[prisma.ts] Engine type: ${isDataProxyEnabled ? "dataproxy" : "library"}`
);

// Create Prisma client with options
function createPrismaClient() {
  try {
    // If in preview environment, we can optionally create a dummy client
    if (isVercelPreview) {
      console.log(
        "[prisma.ts] Creating mock Prisma client for preview environment"
      );

      // For preview deployments, we'll create a real client but many operations will be no-ops
      // This allows the app to build and deploy but prevents database changes
      const previewPrisma = new PrismaClient({
        log: ["error"] as Prisma.LogLevel[],
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      });

      return previewPrisma;
    }

    // Use appropriate log levels based on environment
    const logLevels: Prisma.LogLevel[] =
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"];

    // Create a new PrismaClient with connection pooling appropriate for serverless
    const prisma = new PrismaClient({
      log: logLevels,
      // Only include datasources for library engine type (not needed for dataproxy)
      ...(isDataProxyEnabled
        ? {}
        : {
            datasources: {
              db: {
                url: process.env.DATABASE_URL,
              },
            },
          }),
    });

    // Apply additional serverless optimization for connection reuse
    prisma.$connect();

    return prisma;
  } catch (error) {
    console.error("[prisma.ts] Failed to create Prisma client:", error);

    // Return a dummy client that won't crash the application
    // This is a last resort for environments where Prisma can't connect
    return {
      $connect: async () => {},
      $disconnect: async () => {},
      // Add other dummy methods as needed
    } as unknown as PrismaClient;
  }
}

// Prevent multiple instances of Prisma Client in development
export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma;
