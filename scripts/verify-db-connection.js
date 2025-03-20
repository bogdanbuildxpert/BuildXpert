// Verify database connection script
// Run with: node scripts/verify-db-connection.js

// Load env variables
require("dotenv").config();

// Import configuration first to set up environment
require("../lib/prisma-config");

const { PrismaClient } = require("@prisma/client");

console.log("=== Database Connection Verification ===");
console.log(
  `DATABASE_URL protocol: ${
    process.env.DATABASE_URL?.split("://")[0] || "not set"
  }`
);
console.log(
  `DIRECT_URL protocol: ${process.env.DIRECT_URL?.split("://")[0] || "not set"}`
);
console.log(
  `Engine type: ${process.env.PRISMA_CLIENT_ENGINE_TYPE || "not set"}`
);
console.log(
  `Connection limit: ${process.env.DATABASE_CONNECTION_LIMIT || "default"}`
);
console.log(`Pool timeout: ${process.env.DATABASE_POOL_TIMEOUT || "default"}`);
console.log(
  `URL has pgBouncer config: ${
    process.env.DATABASE_URL?.includes("pgbouncer=true") ? "Yes" : "No"
  }`
);

// Create a Prisma client with verbose logging
const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

async function main() {
  try {
    console.log("\nAttempting database connection...");

    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as connection_test`;
    console.log(`Connection successful! Result: ${JSON.stringify(result)}`);

    // Test connection pooling by running multiple queries
    console.log(
      "\nTesting connection pooling with multiple concurrent queries..."
    );
    const promises = [];
    for (let i = 0; i < 10; i++) {
      // Cast the pg_sleep result to text to avoid the void type deserialization error
      promises.push(
        prisma.$queryRaw`SELECT ${i} as test_query, pg_sleep(0.1)::text as sleep_result`
      );
    }

    await Promise.all(promises);
    console.log("All test queries completed successfully!");
  } catch (error) {
    console.error("Database connection failed:", error);
  } finally {
    await prisma.$disconnect();
    console.log("\nConnection verification completed.");
  }
}

main();
