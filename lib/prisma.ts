// Import prisma-config first to ensure environment is correctly set up
import "./prisma-config";
import { PrismaClient, Prisma } from "@prisma/client";

// Add prisma to the NodeJS global type
declare global {
  var prisma: PrismaClient | undefined;
}

// Check environment variables
const isVercelPreview = process.env.VERCEL_ENV === "preview";
const isVercelProduction =
  process.env.VERCEL === "1" && process.env.NODE_ENV === "production";

// Log environment information
console.log(
  `[prisma.ts] Environment: ${
    isVercelProduction
      ? "Vercel Production"
      : isVercelPreview
      ? "Vercel Preview"
      : "Development"
  }`
);

// Check for connection type
let useDataProxy = false;
if (process.env.DATABASE_URL?.startsWith("prisma://")) {
  useDataProxy = true;
  console.log(
    "[prisma.ts] Using Data Proxy connection (prisma:// protocol detected)"
  );
} else {
  console.log(
    "[prisma.ts] Using direct database connection (postgresql:// protocol)"
  );
}

// Create Prisma client with options
function createPrismaClient() {
  try {
    // Configure connection options based on URL type
    const connectionOptions: any = {
      log: (process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"]) as Prisma.LogLevel[],
    };

    // Configure connection pooling for pgBouncer on serverless
    if (!useDataProxy && (isVercelProduction || isVercelPreview)) {
      console.log(
        "[prisma.ts] Configuring connection pooling for serverless environment"
      );

      // Set max connections and idle timeout for pgBouncer
      const connectionLimit = parseInt(
        process.env.DATABASE_CONNECTION_LIMIT || "5"
      );
      const poolTimeout = parseInt(process.env.DATABASE_POOL_TIMEOUT || "15");

      connectionOptions.datasources = {
        db: {
          url: process.env.DATABASE_URL,
        },
      };

      // Connection pooling settings
      connectionOptions.runtime = {
        engineType: "library",
        connectionPoolOptions: {
          maxSize: connectionLimit,
          idleTimeout: poolTimeout,
          maxUses: 100, // Reset connection after 100 queries
        },
      };
    }

    // Create Prisma client with appropriate configuration
    console.log("[prisma.ts] Creating PrismaClient...");
    const prisma = new PrismaClient(connectionOptions);

    // Connect to validate the connection works
    console.log("[prisma.ts] Connecting to database...");
    prisma
      .$connect()
      .then(() => console.log("[prisma.ts] Successfully connected to database"))
      .catch((err) =>
        console.error("[prisma.ts] Failed to connect to database:", err)
      );

    return prisma;
  } catch (error) {
    console.error("[prisma.ts] Failed to create Prisma client:", error);

    // Return a dummy client that won't crash the application
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
