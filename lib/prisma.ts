// Import prisma-config first to ensure environment is correctly set up
import "./prisma-config";
import { PrismaClient, Prisma } from "@prisma/client";

// Add prisma to the NodeJS global type
declare global {
  var prisma: PrismaClient | undefined;
}

// Check if we're in a Vercel preview environment
const isVercelPreview = process.env.VERCEL_ENV === "preview";

// Log environment information
console.log(
  `[prisma.ts] Environment: ${
    isVercelPreview ? "Vercel Preview" : "Production or Development"
  }`
);
console.log(`[prisma.ts] Engine type: library (direct connections)`);

// Create Prisma client with options
function createPrismaClient() {
  try {
    // Configure connection options for direct connections
    const connectionOptions = {
      log: (process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"]) as Prisma.LogLevel[],
    };

    // Create Prisma client with connection pooling for serverless
    console.log(
      "[prisma.ts] Creating PrismaClient with direct database connection"
    );
    const prisma = new PrismaClient(connectionOptions);

    // Connect to validate the connection works
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
