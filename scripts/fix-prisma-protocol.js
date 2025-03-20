/**
 * Fix Prisma Protocol script - runs at startup to ensure correct protocols
 * This handles the "must start with protocol 'prisma://' error by ensuring proper URL format
 */

function fixPrismaProtocol() {
  console.log("[fix-prisma] Checking database URLs for proper protocol...");

  // Force library engine type
  process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
  process.env.PRISMA_GENERATE_DATAPROXY = "false";

  // Check DATABASE_URL protocol
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    const dbUrlParts = dbUrl.split("://");
    const protocol = dbUrlParts[0];

    // If URL has prisma:// protocol but we're using library engine, convert to postgresql://
    if (
      protocol === "prisma" &&
      process.env.PRISMA_CLIENT_ENGINE_TYPE === "library"
    ) {
      console.log(
        "[fix-prisma] Converting DATABASE_URL from prisma:// to postgresql://"
      );
      process.env.DATABASE_URL = "postgresql://" + dbUrlParts[1];
    }

    // If URL has postgresql:// but we're using dataproxy, that's an error case we need to fix
    if (
      protocol === "postgresql" &&
      process.env.PRISMA_CLIENT_ENGINE_TYPE === "dataproxy"
    ) {
      console.log(
        "[fix-prisma] ⚠️ Warning: DATABASE_URL has postgresql:// protocol but engine type is dataproxy"
      );
      console.log(
        "[fix-prisma] Changing engine type to library to match URL protocol"
      );
      process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
    }
  }

  // Do the same for DIRECT_URL
  const directUrl = process.env.DIRECT_URL;
  if (directUrl) {
    const directUrlParts = directUrl.split("://");
    const protocol = directUrlParts[0];

    // If URL has prisma:// protocol but we're using library engine, convert to postgresql://
    if (
      protocol === "prisma" &&
      process.env.PRISMA_CLIENT_ENGINE_TYPE === "library"
    ) {
      console.log(
        "[fix-prisma] Converting DIRECT_URL from prisma:// to postgresql://"
      );
      process.env.DIRECT_URL = "postgresql://" + directUrlParts[1];
    }
  }

  console.log("[fix-prisma] Database URL protocol check completed");
  console.log(
    "[fix-prisma] Engine type:",
    process.env.PRISMA_CLIENT_ENGINE_TYPE
  );
}

// Run the fix function
fixPrismaProtocol();

// Export in case we want to use it elsewhere
module.exports = { fixPrismaProtocol };
