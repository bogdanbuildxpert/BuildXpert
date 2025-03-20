/**
 * Prisma pregenerate hook - runs before Prisma generates the client
 * This helps prevent the "URL must start with protocol 'prisma://'" error
 */

// Force engine type to library before Prisma does anything
process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
console.log("[prisma:pregenerate] Set PRISMA_CLIENT_ENGINE_TYPE=library");

// Set other important environment variables
process.env.PRISMA_GENERATE_DATAPROXY = "false";
console.log("[prisma:pregenerate] Set PRISMA_GENERATE_DATAPROXY=false");

// Check and fix DATABASE_URL protocol
const dbUrl = process.env.DATABASE_URL;
if (dbUrl && dbUrl.startsWith("prisma://")) {
  const fixedDbUrl = "postgresql://" + dbUrl.substring(9);
  process.env.DATABASE_URL = fixedDbUrl;
  console.log(
    "[prisma:pregenerate] Fixed DATABASE_URL protocol from prisma:// to postgresql://"
  );
}

// Check and fix DIRECT_URL protocol
const directUrl = process.env.DIRECT_URL;
if (directUrl && directUrl.startsWith("prisma://")) {
  const fixedDirectUrl = "postgresql://" + directUrl.substring(9);
  process.env.DIRECT_URL = fixedDirectUrl;
  console.log(
    "[prisma:pregenerate] Fixed DIRECT_URL protocol from prisma:// to postgresql://"
  );
}

// Log the state of variables after fixes
console.log("[prisma:pregenerate] Environment preparation complete:");
console.log(
  "  DATABASE_URL protocol:",
  (process.env.DATABASE_URL || "").split("://")[0]
);
console.log(
  "  DIRECT_URL protocol:",
  (process.env.DIRECT_URL || "").split("://")[0]
);
console.log(
  "  PRISMA_CLIENT_ENGINE_TYPE:",
  process.env.PRISMA_CLIENT_ENGINE_TYPE
);
