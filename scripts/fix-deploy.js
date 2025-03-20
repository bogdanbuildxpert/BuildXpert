/**
 * Fix deployment issues script
 * Helps resolve common Prisma deployment issues
 */

// Set environment variables for Prisma
process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
process.env.PRISMA_GENERATE_DATAPROXY = "false";

console.log("🛠️ Running fix-deploy script...");

// Force Prisma URLs to use PostgreSQL protocol
const fixPrismaProtocol = require("./fix-prisma-protocol").fixPrismaProtocol;
fixPrismaProtocol();

// Log diagnostic info
console.log("📊 Environment information:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log(
  "PRISMA_CLIENT_ENGINE_TYPE:",
  process.env.PRISMA_CLIENT_ENGINE_TYPE
);
console.log(
  "DATABASE_URL protocol:",
  process.env.DATABASE_URL?.split("://")[0]
);
console.log("DIRECT_URL protocol:", process.env.DIRECT_URL?.split("://")[0]);

console.log("✅ Fix deployment script completed");

// Log additional deployment tips
console.log("\n🔧 Deployment tips:");
console.log(
  "1. Ensure PRISMA_CLIENT_ENGINE_TYPE=library is set in Vercel environment variables"
);
console.log(
  "2. Make sure DATABASE_URL and DIRECT_URL use postgresql:// protocol"
);
console.log(
  "3. For edge functions, ensure binary targets are set correctly in schema.prisma"
);
console.log(
  "4. Check if you need to clear .next and node_modules/.prisma cache locally"
);

// Exit successfully
process.exit(0);
