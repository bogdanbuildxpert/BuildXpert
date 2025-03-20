// Configure Prisma environment variables before they're used
// This ensures that URLs are correctly formatted

console.log("[prisma-config] Initializing Prisma configuration");

// Always use library engine type for direct connections
process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
console.log("[prisma-config] Using engine type: library");

// Check if the DATABASE_URL is using the correct protocol
const fixDatabaseUrl = (url: string | undefined): string | undefined => {
  if (!url) return url;

  // Get the protocol from the URL
  const protocol = url.split("://")[0] || "";
  const rest = url.split("://")[1] || url;

  // We need postgresql:// protocol for direct connections
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
  process.env.DIRECT_URL = fixDatabaseUrl(process.env.DIRECT_URL);
  console.log(
    `[prisma-config] DIRECT_URL protocol: ${
      process.env.DIRECT_URL?.split("://")[0] || "unknown"
    }`
  );
}

export default {};
