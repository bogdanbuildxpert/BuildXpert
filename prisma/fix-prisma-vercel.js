/**
 * This script ensures Prisma uses the correct configuration on Vercel.
 * It runs before Prisma Client is generated during build.
 */

function fixPrismaVercel() {
  console.log(
    "[fix-prisma-vercel] Configuring Prisma for Vercel deployment..."
  );

  // Always use library engine type
  process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
  console.log('[fix-prisma-vercel] Set engine type to "library"');

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
  }

  // Log final configuration
  console.log("[fix-prisma-vercel] Prisma configuration summary:");
  console.log(`- Engine type: ${process.env.PRISMA_CLIENT_ENGINE_TYPE}`);
  console.log(
    `- DATABASE_URL protocol: ${
      process.env.DATABASE_URL?.split("://")[0] || "not set"
    }`
  );
  if (process.env.DIRECT_URL) {
    console.log(
      `- DIRECT_URL protocol: ${
        process.env.DIRECT_URL?.split("://")[0] || "not set"
      }`
    );
  }

  console.log("[fix-prisma-vercel] Configuration complete");
}

// Run the function
fixPrismaVercel();

// Export for potential use elsewhere
module.exports = { fixPrismaVercel };
