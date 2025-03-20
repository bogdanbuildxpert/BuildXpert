// This file ensures Prisma is properly configured at runtime

// Check if we're in a build or export environment for Vercel
const isVercelBuild =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.VERCEL_ENV === "production" ||
  (process.env.NODE_ENV === "production" && process.env.VERCEL);

// Set direct PostgreSQL connection string if missing (for all environments)
if (!process.env.DATABASE_URL) {
  // Always use direct PostgreSQL connection
  process.env.DATABASE_URL =
    "postgresql://buildxpertuser:Madalina123@178.62.45.226:5432/buildxpert";
  console.log(
    "[prisma-config] Set DATABASE_URL to direct PostgreSQL connection string"
  );
}

// For all environments, ensure DIRECT_URL is set to allow direct database access
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
  console.log("[prisma-config] Set DIRECT_URL to same as DATABASE_URL");
}

// For Vercel production, make sure we're using a direct connection
if (isVercelBuild && process.env.DIRECT_URL) {
  console.log(
    "[prisma-config] Vercel build detected - ensuring database connection uses DIRECT_URL"
  );
}

// Log the current connection configuration for debugging
console.log("[prisma-config] Database configuration:", {
  DATABASE_URL: process.env.DATABASE_URL.split("@")[1], // Log without credentials
  DIRECT_URL: process.env.DIRECT_URL.split("@")[1], // Log without credentials
  isVercelBuild,
});

// Set Prisma client engine type for edge compatibility
if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
  console.log("[prisma-config] Setting PRISMA_CLIENT_ENGINE_TYPE=library");
  process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
}

// Disable Prisma Data Proxy to ensure direct connections
process.env.PRISMA_GENERATE_DATAPROXY = "false";

module.exports = {
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  PRISMA_CLIENT_ENGINE_TYPE: process.env.PRISMA_CLIENT_ENGINE_TYPE,
  PRISMA_GENERATE_DATAPROXY: process.env.PRISMA_GENERATE_DATAPROXY,
};
