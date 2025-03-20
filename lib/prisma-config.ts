// Configure Prisma environment variables before they're used
// This ensures that URLs are correctly formatted

// Check if we're in a Vercel environment
const isVercelPreview = process.env.VERCEL_ENV === "preview";

if (isVercelPreview) {
  console.log("[prisma-config] Running in Vercel preview environment");
} else {
  console.log(
    "[prisma-config] Running in production or development environment"
  );
}

// Always use library engine type
process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";

// Check if the DATABASE_URL is using the correct protocol
const fixDatabaseUrl = (url: string | undefined): string | undefined => {
  if (!url) return url;

  // Get the protocol from the URL
  const protocol = url.split("://")[0] || "";
  const rest = url.split("://")[1] || url;

  // For library engine, we need postgresql:// protocol
  if (protocol !== "postgresql" && protocol !== "postgres") {
    console.log(
      `[prisma-config] Converting ${protocol}:// to postgresql:// for library engine`
    );
    return `postgresql://${rest}`;
  }
  return url;
};

// Set environment variables before Prisma tries to use them
if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = fixDatabaseUrl(process.env.DATABASE_URL);
  console.log(
    `[prisma-config] DATABASE_URL protocol: ${
      process.env.DATABASE_URL?.split("://")[0] || "unknown"
    }`
  );
}

// Direct URL should always use postgresql://
if (process.env.DIRECT_URL) {
  const directUrl = process.env.DIRECT_URL;
  const protocol = directUrl.split("://")[0] || "";
  const rest = directUrl.split("://")[1] || directUrl;

  if (protocol !== "postgresql" && protocol !== "postgres") {
    process.env.DIRECT_URL = `postgresql://${rest}`;
    console.log("[prisma-config] Setting DIRECT_URL protocol to postgresql://");
  }
}

// Log engine type
console.log(
  "[prisma-config] Engine type:",
  process.env.PRISMA_CLIENT_ENGINE_TYPE || "not set"
);

export default {};
