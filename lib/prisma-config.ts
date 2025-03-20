// Configure Prisma environment variables before they're used
// This ensures that URLs are correctly formatted

console.log("[prisma-config] Initializing Prisma configuration");

// Only set engine type if not already defined
if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
  // Check if the URL suggests data proxy
  if (process.env.DATABASE_URL?.startsWith("prisma://")) {
    process.env.PRISMA_CLIENT_ENGINE_TYPE = "dataproxy";
    console.log(
      "[prisma-config] Detected prisma:// URL, using dataproxy engine"
    );
  } else {
    process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
    console.log(
      "[prisma-config] Using library engine type for direct connections"
    );
  }
} else {
  console.log(
    `[prisma-config] Using existing engine type: ${process.env.PRISMA_CLIENT_ENGINE_TYPE}`
  );
}

// Set connection pool configuration for pgBouncer
if (process.env.PRISMA_CLIENT_ENGINE_TYPE === "library") {
  // Configure connection limits for pgBouncer compatibility
  process.env.DATABASE_CONNECTION_LIMIT = "5";
  process.env.DATABASE_POOL_TIMEOUT = "15";
  console.log(
    `[prisma-config] Set connection pool limits for pgBouncer compatibility`
  );
}

// Only modify URLs if needed
if (
  process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.startsWith("prisma://")
) {
  // For library engine, ensure postgresql:// protocol
  if (process.env.PRISMA_CLIENT_ENGINE_TYPE === "library") {
    // Get the protocol from the URL
    const urlParts = process.env.DATABASE_URL.split("://");
    const protocol = urlParts[0] || "";
    const rest = urlParts.length > 1 ? urlParts[1] : process.env.DATABASE_URL;

    // Fix the protocol if needed
    if (protocol !== "postgresql" && protocol !== "postgres") {
      process.env.DATABASE_URL = `postgresql://${rest}`;
      console.log(
        `[prisma-config] Fixed DATABASE_URL protocol: ${protocol}:// → postgresql://`
      );
    }

    // Add pgBouncer configuration to URLs
    if (!process.env.DATABASE_URL.includes("pgbouncer=true")) {
      process.env.DATABASE_URL = `${process.env.DATABASE_URL}${
        process.env.DATABASE_URL.includes("?") ? "&" : "?"
      }pgbouncer=true&connection_limit=5`;
      console.log(
        `[prisma-config] Added pgBouncer configuration to DATABASE_URL`
      );
    }
  }
  console.log(
    `[prisma-config] DATABASE_URL protocol: ${
      process.env.DATABASE_URL?.split("://")[0] || "unknown"
    }`
  );
} else {
  console.log(
    `[prisma-config] DATABASE_URL protocol: ${
      process.env.DATABASE_URL?.split("://")[0] || "not set"
    }`
  );
}

// Direct URL should always use postgresql://
if (process.env.DIRECT_URL) {
  const urlParts = process.env.DIRECT_URL.split("://");
  const protocol = urlParts[0] || "";
  const rest = urlParts.length > 1 ? urlParts[1] : process.env.DIRECT_URL;

  if (protocol !== "postgresql" && protocol !== "postgres") {
    process.env.DIRECT_URL = `postgresql://${rest}`;
    console.log(
      `[prisma-config] Fixed DIRECT_URL protocol: ${protocol}:// → postgresql://`
    );
  }

  // Direct URLs should not use pgBouncer for schema migrations
  if (process.env.DIRECT_URL.includes("pgbouncer=true")) {
    process.env.DIRECT_URL = process.env.DIRECT_URL.replace(
      /[?&]pgbouncer=true(&|$)/,
      "$1"
    );
    console.log(
      `[prisma-config] Removed pgBouncer configuration from DIRECT_URL for migrations`
    );
  }

  console.log(
    `[prisma-config] DIRECT_URL protocol: ${
      process.env.DIRECT_URL?.split("://")[0] || "unknown"
    }`
  );
}

export default {};
