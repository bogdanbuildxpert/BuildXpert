// Import prisma-config first to ensure environment is correctly set up
import "./prisma-config";
import { PrismaClient } from "@prisma/client";

// Add prisma to the NodeJS global type
declare global {
  var prisma: PrismaClient | undefined;
}

// Create Prisma client with options
function createPrismaClient() {
  try {
    return new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });
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
