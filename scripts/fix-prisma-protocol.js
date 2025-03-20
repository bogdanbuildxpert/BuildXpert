/**
 * Fix Prisma Protocol script - runs at startup to ensure correct protocols
 * This handles the "must start with protocol 'prisma://' error by ensuring proper URL format
 */

function fixPrismaProtocol() {
  console.log("[fix-prisma] Checking database URLs for proper protocol...");

  // Check if using dataproxy or library engine
  const isDataProxy =
    process.env.PRISMA_CLIENT_ENGINE_TYPE === "dataproxy" ||
    (process.env.VERCEL === "1" && process.env.NODE_ENV === "production");

  // Force dataproxy for Vercel production environment
  if (process.env.VERCEL === "1" && process.env.NODE_ENV === "production") {
    console.log(
      "[fix-prisma] Vercel production detected, using dataproxy engine"
    );
    process.env.PRISMA_CLIENT_ENGINE_TYPE = "dataproxy";
  } else {
    // Default to library for non-Vercel environments
    process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
  }

  // Log the engine type we're using
  console.log(
    `[fix-prisma] Using engine type: ${process.env.PRISMA_CLIENT_ENGINE_TYPE}`
  );

  // Check DATABASE_URL protocol
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    const dbUrlParts = dbUrl.split("://");
    const protocol = dbUrlParts[0];

    // For dataproxy, we need prisma:// protocol
    if (isDataProxy) {
      // If URL doesn't have prisma:// protocol but we're using dataproxy, convert it
      if (protocol !== "prisma") {
        console.log(
          `[fix-prisma] Converting DATABASE_URL from ${protocol}:// to prisma://`
        );
        process.env.DATABASE_URL = "prisma://" + dbUrlParts[1];
      }
    }
    // For library, we need postgresql:// protocol
    else {
      // If URL has prisma:// protocol but we're using library, convert to postgresql://
      if (protocol === "prisma") {
        console.log(
          "[fix-prisma] Converting DATABASE_URL from prisma:// to postgresql://"
        );
        process.env.DATABASE_URL = "postgresql://" + dbUrlParts[1];
      }

      // Ensure URL has postgresql:// protocol for library engine
      if (protocol !== "postgresql" && protocol !== "postgres") {
        console.log(
          `[fix-prisma] Converting DATABASE_URL from ${protocol}:// to postgresql://`
        );
        process.env.DATABASE_URL = "postgresql://" + dbUrlParts[1];
      }
    }
  }

  // Do the same for DIRECT_URL
  const directUrl = process.env.DIRECT_URL;
  if (directUrl) {
    const directUrlParts = directUrl.split("://");
    const protocol = directUrlParts[0];

    // DIRECT_URL should always be postgresql:// regardless of engine type
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
      process.env.DATABASE_URL?.split("://")[0]
    }`
  );
  if (process.env.DIRECT_URL) {
    console.log(
      `[fix-prisma] DIRECT_URL protocol: ${
        process.env.DIRECT_URL?.split("://")[0]
      }`
    );
  }
}

// Run the fix function
fixPrismaProtocol();

// Export in case we want to use it elsewhere
module.exports = { fixPrismaProtocol };
