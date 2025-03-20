/**
 * Fix Prisma Protocol script - runs at startup to ensure correct protocols
 * This handles the "must start with protocol 'prisma://' error by ensuring proper URL format
 */

function fixPrismaProtocol() {
  console.log("[fix-prisma] Checking database URLs for proper protocol...");

  // Always use library engine type (not dataproxy)
  process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
  console.log(
    `[fix-prisma] Using engine type: ${process.env.PRISMA_CLIENT_ENGINE_TYPE}`
  );

  // Check DATABASE_URL protocol
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    const dbUrlParts = dbUrl.split("://");
    const protocol = dbUrlParts[0];

    // For library engine, we need postgresql:// protocol
    if (protocol !== "postgresql" && protocol !== "postgres") {
      console.log(
        `[fix-prisma] Converting DATABASE_URL from ${protocol}:// to postgresql://`
      );
      process.env.DATABASE_URL = "postgresql://" + dbUrlParts[1];
    }
  }

  // Do the same for DIRECT_URL
  const directUrl = process.env.DIRECT_URL;
  if (directUrl) {
    const directUrlParts = directUrl.split("://");
    const protocol = directUrlParts[0];

    // DIRECT_URL should always be postgresql://
    if (protocol !== "postgresql" && protocol !== "postgres") {
      console.log(
        `[fix-prisma] Converting DIRECT_URL from ${protocol}:// to postgresql://`
      );
      process.env.DIRECT_URL = "postgresql://" + directUrlParts[1];
    }
  }

  console.log("[fix-prisma] Database URL protocol check completed");
  console.log(
    `[fix-prisma] DATABASE_URL protocol: ${
      process.env.DATABASE_URL?.split("://")[0] || "not set"
    }`
  );
  if (process.env.DIRECT_URL) {
    console.log(
      `[fix-prisma] DIRECT_URL protocol: ${
        process.env.DIRECT_URL?.split("://")[0] || "not set"
      }`
    );
  }
}

// Run the fix function
fixPrismaProtocol();

// Export in case we want to use it elsewhere
module.exports = { fixPrismaProtocol };
