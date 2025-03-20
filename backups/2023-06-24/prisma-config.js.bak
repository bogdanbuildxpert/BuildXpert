// This file ensures Prisma is properly configured at runtime

// Check if we're in a build or export environment for Vercel
const isVercelBuild =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.VERCEL_ENV === "production" ||
  (process.env.NODE_ENV === "production" && process.env.VERCEL);

// Set PostgreSQL connection string if missing
if (!process.env.DATABASE_URL) {
  if (isVercelBuild) {
    // Use Prisma Accelerate format for Vercel builds
    process.env.DATABASE_URL =
      "prisma://aws-eu-west-1.prisma-data.com/?api_key=mock-key-for-static-build";
    console.log(
      "[prisma-config] Set DATABASE_URL to Prisma Accelerate format for Vercel"
    );
  } else {
    // Use direct PostgreSQL connection for local development
    process.env.DATABASE_URL =
      "postgresql://buildxpertuser:Madalina123@178.62.45.226:5432/buildxpert";
    console.log(
      "[prisma-config] Set DATABASE_URL to PostgreSQL connection string"
    );
  }
}

// Handle protocol conversion for Vercel
if (isVercelBuild && process.env.DATABASE_URL.startsWith("postgresql://")) {
  const originalUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL =
    "prisma://aws-eu-west-1.prisma-data.com/?api_key=mock-key-for-static-build";
  console.log(
    "[prisma-config] Converted DATABASE_URL from PostgreSQL to Prisma Accelerate format"
  );

  // Set direct URL for actual database access if it's missing
  if (!process.env.DIRECT_URL) {
    process.env.DIRECT_URL = originalUrl;
    console.log("[prisma-config] Set DIRECT_URL to original PostgreSQL URL");
  }
} else if (!process.env.DIRECT_URL) {
  // For non-Vercel environments, set DIRECT_URL to same as DATABASE_URL if missing
  process.env.DIRECT_URL = process.env.DATABASE_URL;
  console.log("[prisma-config] Set DIRECT_URL to same as DATABASE_URL");
}

// Set Prisma client engine type for edge compatibility
if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
  console.log("[prisma-config] Setting PRISMA_CLIENT_ENGINE_TYPE=library");
  process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
}

// Disable Prisma Data Proxy
process.env.PRISMA_GENERATE_DATAPROXY = "false";

module.exports = {
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  PRISMA_CLIENT_ENGINE_TYPE: process.env.PRISMA_CLIENT_ENGINE_TYPE,
  PRISMA_GENERATE_DATAPROXY: process.env.PRISMA_GENERATE_DATAPROXY,
};
