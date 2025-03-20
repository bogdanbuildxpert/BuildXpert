// This file ensures Prisma is properly configured at runtime

// Force environment variables if they're missing
if (!process.env.DATABASE_URL) {
  console.log("[prisma-config] Setting missing DATABASE_URL");
  process.env.DATABASE_URL =
    "postgresql://buildxpertuser:Madalina123@178.62.45.226:5432/buildxpert";
}

if (!process.env.DIRECT_URL) {
  console.log("[prisma-config] Setting missing DIRECT_URL");
  process.env.DIRECT_URL =
    "postgresql://buildxpertuser:Madalina123@178.62.45.226:5432/buildxpert";
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
