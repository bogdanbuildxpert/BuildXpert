/**
 * Setup Preview Environment
 *
 * This script handles environment configuration for preview deployments on Vercel
 * For production, it leaves the real DATABASE_URL intact
 * For preview environments, it configures a mock database URL that doesn't affect production
 */

function setupPreviewEnvironment() {
  // Check if we're in a Vercel preview deployment
  const isVercelPreview = process.env.VERCEL_ENV === "preview";

  console.log(
    `[setup-preview] Environment: ${
      isVercelPreview ? "Vercel Preview" : "Production or Development"
    }`
  );

  // Always use library engine
  process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
  console.log("[setup-preview] Using library engine type");

  if (isVercelPreview) {
    // For preview environments, we use a mock database
    console.log(
      "[setup-preview] Preview environment detected - using mock database"
    );

    // Set mock DATABASE_URL for preview environment
    // This prevents the preview deployment from connecting to production database
    if (process.env.DATABASE_URL) {
      console.log(
        "[setup-preview] Setting mock DATABASE_URL for preview environment"
      );

      // Create a mock DATABASE_URL that follows the correct format but won't actually connect
      // This allows Prisma to initialize but won't affect any real database
      process.env.DATABASE_URL =
        "postgresql://dummy:dummy@localhost:5432/preview_db?schema=public";

      // Also set DIRECT_URL if it exists
      if (process.env.DIRECT_URL) {
        process.env.DIRECT_URL = process.env.DATABASE_URL;
      }

      console.log(
        "[setup-preview] Preview environment configured with mock database"
      );
    }
  } else {
    // For production and development, use the standard library client
    console.log("[setup-preview] Using standard database configuration");

    // Ensure DATABASE_URL has postgresql:// protocol
    if (
      process.env.DATABASE_URL &&
      !process.env.DATABASE_URL.startsWith("postgresql://")
    ) {
      const dbUrlParts = process.env.DATABASE_URL.split("://");
      console.log(
        `[setup-preview] Converting DATABASE_URL from ${dbUrlParts[0]}:// to postgresql://`
      );
      process.env.DATABASE_URL = `postgresql://${
        dbUrlParts[1] || process.env.DATABASE_URL
      }`;
    }
  }
}

// Run the setup function
setupPreviewEnvironment();

// Export in case we want to use it elsewhere
module.exports = { setupPreviewEnvironment };
