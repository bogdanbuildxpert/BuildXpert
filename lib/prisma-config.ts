// Configure Prisma environment variables before they're used
// This ensures that URLs are correctly formatted

// Check if we're in a Vercel preview deployment
const isVercelPreview = process.env.VERCEL_ENV === "preview";
if (isVercelPreview) {
  console.log("[prisma-config] Running in Vercel preview environment");
}

// Check if the DATABASE_URL is using the correct protocol
const fixDatabaseUrl = (url: string | undefined): string | undefined => {
  if (!url) return url;

  // If URL starts with prisma://, leave it as is
  if (url.startsWith("prisma://")) {
    return url;
  }

  // If URL starts with postgresql://, it should be fine for Prisma
  if (url.startsWith("postgresql://")) {
    return url;
  }

  // If URL doesn't have a proper protocol, log an error
  console.error(
    `[prisma-config] Invalid DATABASE_URL protocol: ${
      url.split("://")[0] || "missing"
    }`
  );

  // Try to fix the URL by replacing or adding postgresql:// prefix
  if (url.includes("://")) {
    // Replace the existing protocol with postgresql://
    return url.replace(/^.*?:\/\//, "postgresql://");
  } else {
    // Add the postgresql:// prefix if no protocol exists
    return `postgresql://${url}`;
  }
};

// Set environment variables before Prisma tries to use them
if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = fixDatabaseUrl(process.env.DATABASE_URL);
  console.log("[prisma-config] Setting DATABASE_URL protocol to postgresql://");
}

if (process.env.DIRECT_URL) {
  process.env.DIRECT_URL = fixDatabaseUrl(process.env.DIRECT_URL);
  console.log("[prisma-config] Setting DIRECT_URL protocol to postgresql://");
}

// Set engine type for Prisma (important for serverless environments)
if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
  process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
  console.log("[prisma-config] Setting PRISMA_CLIENT_ENGINE_TYPE=library");
}

export default {};
