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
  const isVercelProduction =
    process.env.VERCEL === "1" && process.env.NODE_ENV === "production";

  console.log(
    `[setup-preview] Environment: ${
      isVercelProduction
        ? "Vercel Production"
        : isVercelPreview
        ? "Vercel Preview"
        : "Development/Other"
    }`
  );

  // Determine if we need to use Data Proxy
  if (isVercelProduction) {
    console.log(
      "[setup-preview] Production environment detected - using Data Proxy"
    );
    process.env.PRISMA_CLIENT_ENGINE_TYPE = "dataproxy";

    // Ensure URL has prisma:// protocol for Data Proxy
    if (
      process.env.DATABASE_URL &&
      !process.env.DATABASE_URL.startsWith("prisma://")
    ) {
      // Save the original URL in case we need it
      process.env.ORIGINAL_DATABASE_URL = process.env.DATABASE_URL;

      // Add prisma:// protocol if DATABASE_URL doesn't already have it
      if (process.env.DATABASE_URL.includes("://")) {
        // Replace existing protocol with prisma://
        process.env.DATABASE_URL = process.env.DATABASE_URL.replace(
          /^.*?:\/\//,
          "prisma://"
        );
      } else {
        // Add prisma:// prefix if no protocol exists
        process.env.DATABASE_URL = `prisma://${process.env.DATABASE_URL}`;
      }

      console.log("[setup-preview] Set DATABASE_URL protocol to prisma://");
    }
  } else if (isVercelPreview) {
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
    // For development, we use the standard library client
    console.log(
      "[setup-preview] Development/Other environment - using library engine"
    );
    process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
  }
}

// Run the setup function
setupPreviewEnvironment();

// Export in case we want to use it elsewhere
module.exports = { setupPreviewEnvironment };
