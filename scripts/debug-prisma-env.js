// This script runs before build to check Prisma environment
console.log("🔍 Checking Prisma environment before build...");

// Force library engine type
process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";

// Load environment variables
require("dotenv").config();

function maskString(str) {
  if (!str) return "undefined";
  if (str.length <= 8) return "********";
  return str.substring(0, 4) + "********" + str.substring(str.length - 4);
}

// Check for DATABASE_URL
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("❌ DATABASE_URL is not defined in environment");
  process.exit(1);
}

// Extract protocol from DATABASE_URL
const dbUrlParts = dbUrl.split("://");
const protocol = dbUrlParts[0];

console.log(`📊 Database URL protocol: ${protocol}`);

// Check if we're in Vercel production environment
const isVercelProd =
  process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production";
const isStaticBuild = process.env.NEXT_PHASE === "phase-production-build";

// Always use the real database connection - no more mock URLs
if (isVercelProd || isStaticBuild) {
  console.log("🔄 Production build detected - using real DATABASE_URL");

  // Ensure DIRECT_URL is set to the original DATABASE_URL for direct connection
  if (!process.env.DIRECT_URL) {
    console.log(
      "📝 Setting DIRECT_URL to original DATABASE_URL for direct connection"
    );
    process.env.DIRECT_URL = dbUrl;
  }
} else if (protocol === "prisma" && !isVercelProd && !isStaticBuild) {
  // In non-Vercel environments, we might want to fix prisma:// to postgresql://
  const correctedUrl = "postgresql://" + dbUrlParts[1];
  console.log(`🔧 Setting corrected DATABASE_URL: postgresql://****`);
  process.env.DATABASE_URL = correctedUrl;
}

// Check for DIRECT_URL
const directUrl = process.env.DIRECT_URL;
if (!directUrl) {
  console.warn("⚠️ DIRECT_URL is not defined, using DATABASE_URL as fallback");
  process.env.DIRECT_URL = process.env.DATABASE_URL;
} else {
  const directUrlParts = directUrl.split("://");
  const directProtocol = directUrlParts[0];

  console.log(`📊 Direct URL protocol: ${directProtocol}`);

  // Check for correct protocol for DIRECT_URL
  if (directProtocol !== "postgresql") {
    console.warn(
      `⚠️ DIRECT_URL protocol is ${directProtocol}, but should be postgresql`
    );

    // Try to fix the URL
    if (directProtocol === "prisma") {
      const correctedDirectUrl = "postgresql://" + directUrlParts[1];
      console.log(`🔧 Setting corrected DIRECT_URL: postgresql://****`);
      process.env.DIRECT_URL = correctedDirectUrl;
    }
  }
}

// Set engine type for edge compatibility - force to library always
console.log(
  "🔧 Setting PRISMA_CLIENT_ENGINE_TYPE to library for edge compatibility"
);
process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";

// If PRISMA_GENERATE_DATAPROXY environment variable exists, set it to false
process.env.PRISMA_GENERATE_DATAPROXY = "false";
console.log("🔧 Setting PRISMA_GENERATE_DATAPROXY=false");

// Log environment variables (masked for security)
console.log("\n🔐 Environment Variables for Prisma:");
console.log(`DATABASE_URL: ${maskString(process.env.DATABASE_URL)}`);
console.log(`DIRECT_URL: ${maskString(process.env.DIRECT_URL)}`);
console.log(
  `PRISMA_CLIENT_ENGINE_TYPE: ${process.env.PRISMA_CLIENT_ENGINE_TYPE}`
);

console.log("\n✅ Prisma environment check completed");
