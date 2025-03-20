/**
 * This script ensures Prisma uses the correct configuration on Vercel.
 * It runs before Prisma Client is generated during build.
 */

function fixPrismaVercel() {
  console.log(
    "[fix-prisma-vercel] Configuring Prisma for Vercel deployment..."
  );
  console.log(
    "[fix-prisma-vercel] Build triggered at: " + new Date().toISOString()
  );

  // Always use library engine type
  process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
  console.log('[fix-prisma-vercel] Set engine type to "library"');

  // Set connection pooling configuration
  process.env.DATABASE_CONNECTION_LIMIT =
    process.env.DATABASE_CONNECTION_LIMIT || "5";
  process.env.DATABASE_POOL_TIMEOUT = process.env.DATABASE_POOL_TIMEOUT || "15";
  console.log(
    `[fix-prisma-vercel] Set connection pool limits: limit=${process.env.DATABASE_CONNECTION_LIMIT}, timeout=${process.env.DATABASE_POOL_TIMEOUT}`
  );

  // Check DATABASE_URL and fix protocol if needed
  if (process.env.DATABASE_URL) {
    const dbUrl = process.env.DATABASE_URL;
    if (
      !dbUrl.startsWith("postgresql://") &&
      !dbUrl.startsWith("postgres://")
    ) {
      // Extract parts after protocol
      const urlParts = dbUrl.split("://");
      const protocol = urlParts[0];
      const rest = urlParts.length > 1 ? urlParts[1] : dbUrl;

      // Set correct protocol
      process.env.DATABASE_URL = `postgresql://${rest}`;
      console.log(
        `[fix-prisma-vercel] Fixed DATABASE_URL protocol: ${protocol}:// → postgresql://`
      );
    } else {
      console.log(
        "[fix-prisma-vercel] DATABASE_URL already has correct postgresql:// protocol"
      );
    }

    // Add pgBouncer configuration if not already present
    if (!process.env.DATABASE_URL.includes("pgbouncer=true")) {
      process.env.DATABASE_URL = `${process.env.DATABASE_URL}${
        process.env.DATABASE_URL.includes("?") ? "&" : "?"
      }pgbouncer=true&connection_limit=${
        process.env.DATABASE_CONNECTION_LIMIT
      }`;
      console.log(
        "[fix-prisma-vercel] Added pgBouncer configuration to DATABASE_URL"
      );
    }
  } else {
    console.warn(
      "[fix-prisma-vercel] Warning: DATABASE_URL environment variable not found"
    );
  }

  // Do the same for DIRECT_URL if it exists
  if (process.env.DIRECT_URL) {
    const directUrl = process.env.DIRECT_URL;
    if (
      !directUrl.startsWith("postgresql://") &&
      !directUrl.startsWith("postgres://")
    ) {
      // Extract parts after protocol
      const urlParts = directUrl.split("://");
      const protocol = urlParts[0];
      const rest = urlParts.length > 1 ? urlParts[1] : directUrl;

      // Set correct protocol
      process.env.DIRECT_URL = `postgresql://${rest}`;
      console.log(
        `[fix-prisma-vercel] Fixed DIRECT_URL protocol: ${protocol}:// → postgresql://`
      );
    } else {
      console.log(
        "[fix-prisma-vercel] DIRECT_URL already has correct postgresql:// protocol"
      );
    }

    // Remove pgBouncer from DIRECT_URL if present (needed for schema migrations)
    if (process.env.DIRECT_URL.includes("pgbouncer=true")) {
      process.env.DIRECT_URL = process.env.DIRECT_URL.replace(
        /[?&]pgbouncer=true(&|$)/,
        "$1"
      );
      console.log(
        "[fix-prisma-vercel] Removed pgBouncer configuration from DIRECT_URL for migrations"
      );
    }
  }

  // Log final configuration
  console.log("[fix-prisma-vercel] Prisma configuration summary:");
  console.log(`- Engine type: ${process.env.PRISMA_CLIENT_ENGINE_TYPE}`);
  console.log(
    `- Connection pool limit: ${process.env.DATABASE_CONNECTION_LIMIT}`
  );
  console.log(
    `- Connection pool timeout: ${process.env.DATABASE_POOL_TIMEOUT}`
  );
  console.log(
    `- DATABASE_URL protocol: ${
      process.env.DATABASE_URL?.split("://")[0] || "not set"
    }`
  );
  console.log(
    `- DATABASE_URL has pgBouncer: ${
      process.env.DATABASE_URL?.includes("pgbouncer=true") ? "Yes" : "No"
    }`
  );

  if (process.env.DIRECT_URL) {
    console.log(
      `- DIRECT_URL protocol: ${
        process.env.DIRECT_URL?.split("://")[0] || "not set"
      }`
    );
    console.log(
      `- DIRECT_URL has pgBouncer: ${
        process.env.DIRECT_URL?.includes("pgbouncer=true") ? "Yes" : "No"
      }`
    );
  }

  console.log("[fix-prisma-vercel] Configuration complete");
}

// Run the function
fixPrismaVercel();

// Export for potential use elsewhere
module.exports = { fixPrismaVercel };
