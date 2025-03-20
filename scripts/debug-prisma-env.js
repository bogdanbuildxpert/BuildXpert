// This script runs before build to check Prisma environment
console.log("🔍 Checking Prisma environment before build...");

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

// Check for correct protocol
if (protocol !== "postgresql") {
  console.warn(
    `⚠️ DATABASE_URL protocol is ${protocol}, but should be postgresql`
  );

  // Try to fix the URL
  if (protocol === "prisma") {
    const correctedUrl = "postgresql://" + dbUrlParts[1];
    console.log(`🔧 Setting corrected DATABASE_URL: postgresql://****`);
    process.env.DATABASE_URL = correctedUrl;
  }
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

  // Check for correct protocol
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

// Set engine type for edge compatibility
if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
  console.log(
    "🔧 Setting PRISMA_CLIENT_ENGINE_TYPE to library for edge compatibility"
  );
  process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
}

// Log environment variables (masked for security)
console.log("\n🔐 Environment Variables for Prisma:");
console.log(`DATABASE_URL: ${maskString(process.env.DATABASE_URL)}`);
console.log(`DIRECT_URL: ${maskString(process.env.DIRECT_URL)}`);
console.log(
  `PRISMA_CLIENT_ENGINE_TYPE: ${process.env.PRISMA_CLIENT_ENGINE_TYPE}`
);

console.log("\n✅ Prisma environment check completed");
