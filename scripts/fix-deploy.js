// This script checks and fixes common Vercel deployment issues
// Run with: node scripts/fix-deploy.js

require("dotenv").config();
const fs = require("fs");
const path = require("path");

console.log("🚀 BuildXpert Deployment Fix Utility");
console.log("====================================");

// Check for correct database URL format
function checkDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  console.log("\n📊 Checking database connection URLs...");

  if (!databaseUrl) {
    console.error("❌ DATABASE_URL is not set in environment variables");
    return false;
  }

  if (!databaseUrl.startsWith("postgresql://")) {
    console.error(
      `❌ DATABASE_URL has incorrect protocol: ${databaseUrl.split("://")[0]}`
    );
    console.log("   It should start with postgresql://");
    return false;
  }

  console.log("✅ DATABASE_URL has correct format");

  if (directUrl && !directUrl.startsWith("postgresql://")) {
    console.error(
      `❌ DIRECT_URL has incorrect protocol: ${directUrl.split("://")[0]}`
    );
    console.log("   It should start with postgresql://");
    return false;
  } else if (directUrl) {
    console.log("✅ DIRECT_URL has correct format");
  }

  return true;
}

// Check if JWT_SECRET is set
function checkJwtSecret() {
  console.log("\n🔐 Checking JWT configuration...");

  if (!process.env.JWT_SECRET) {
    console.error("❌ JWT_SECRET is not set in environment variables");
    return false;
  }

  if (process.env.JWT_SECRET === "your-secret-key") {
    console.error(
      "❌ JWT_SECRET is using the default value. This is not secure!"
    );
    return false;
  }

  console.log("✅ JWT_SECRET is properly set");
  return true;
}

// Check if required environment variables for email are set
function checkEmailConfig() {
  console.log("\n📧 Checking email configuration...");

  const requiredVars = [
    "EMAIL_SERVER_HOST",
    "EMAIL_SERVER_PORT",
    "EMAIL_SERVER_USER",
    "EMAIL_SERVER_PASSWORD",
  ];

  let allSet = true;

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      console.error(`❌ ${varName} is not set in environment variables`);
      allSet = false;
    } else {
      console.log(`✅ ${varName} is set`);
    }
  }

  return allSet;
}

// Check prisma schema
function checkPrismaSchema() {
  console.log("\n📝 Checking Prisma schema...");

  const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");

  try {
    if (!fs.existsSync(schemaPath)) {
      console.error("❌ Prisma schema file not found at:", schemaPath);
      return false;
    }

    const schema = fs.readFileSync(schemaPath, "utf8");

    // Check for client generator configuration
    if (!schema.includes('provider = "prisma-client-js"')) {
      console.error(
        "❌ Prisma schema missing proper client provider configuration"
      );
      return false;
    }

    // Check for proper database configuration
    if (!schema.includes('provider = "postgresql"')) {
      console.error(
        "❌ Prisma schema missing proper database provider configuration"
      );
      return false;
    }

    console.log("✅ Prisma schema looks good");
    return true;
  } catch (error) {
    console.error("❌ Error reading Prisma schema:", error.message);
    return false;
  }
}

// Run all checks
function runDiagnostics() {
  console.log("\nRunning pre-deployment diagnostics...");

  const dbOk = checkDatabaseUrl();
  const jwtOk = checkJwtSecret();
  const emailOk = checkEmailConfig();
  const prismaOk = checkPrismaSchema();

  console.log("\n📋 Diagnostics Summary:");
  console.log("Database config:", dbOk ? "✅ OK" : "❌ Issues found");
  console.log("JWT config:", jwtOk ? "✅ OK" : "❌ Issues found");
  console.log("Email config:", emailOk ? "✅ OK" : "❌ Issues found");
  console.log("Prisma schema:", prismaOk ? "✅ OK" : "❌ Issues found");

  const allOk = dbOk && jwtOk && emailOk && prismaOk;

  console.log(
    "\n🏁 Final result:",
    allOk ? "✅ All checks passed" : "❌ Some checks failed"
  );

  if (!allOk) {
    console.log("\nPlease fix the issues above before deploying.");
  } else {
    console.log("\nYour project should be ready for deployment!");
  }

  return allOk;
}

// Run the diagnostics
runDiagnostics();
