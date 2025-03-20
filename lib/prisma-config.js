// This file ensures Prisma is properly configured at runtime

// Set PostgreSQL connection string if missing
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    "postgresql://buildxpertuser:Madalina123@178.62.45.226:5432/buildxpert";
  console.log(
    "[prisma-config] Set DATABASE_URL to PostgreSQL connection string"
  );
}

// Set direct URL for Prisma if missing
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
  console.log("[prisma-config] Set DIRECT_URL to same as DATABASE_URL");
}

if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
  console.log("[prisma-config] Setting PRISMA_CLIENT_ENGINE_TYPE=binary");
  process.env.PRISMA_CLIENT_ENGINE_TYPE = "binary";
}

// Disable Prisma Data Proxy
process.env.PRISMA_GENERATE_DATAPROXY = "false";

module.exports = {
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  PRISMA_CLIENT_ENGINE_TYPE: process.env.PRISMA_CLIENT_ENGINE_TYPE,
  PRISMA_GENERATE_DATAPROXY: process.env.PRISMA_GENERATE_DATAPROXY,
};
