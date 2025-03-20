/**
 * This script runs before Prisma Client generation.
 * It ensures that Prisma is correctly configured for Vercel.
 */

// First run our Vercel fix script to ensure proper configuration
require("./fix-prisma-vercel");

console.log("[pregenerate] Preparing for Prisma Client generation...");

// Always force library engine type for generation
process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";

// Log configuration being used
console.log(
  `[pregenerate] Using engine type: ${process.env.PRISMA_CLIENT_ENGINE_TYPE}`
);
console.log(
  `[pregenerate] Database URL protocol: ${
    process.env.DATABASE_URL?.split("://")[0] || "not set"
  }`
);

console.log("[pregenerate] Ready to generate Prisma Client");
