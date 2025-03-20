// Script to debug and fix Prisma environment issues
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("=============== DEBUG PRISMA ENV ===============");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log(
  "DATABASE_URL:",
  process.env.DATABASE_URL ? "SET (masked for security)" : "NOT SET"
);
console.log(
  "DIRECT_URL:",
  process.env.DIRECT_URL ? "SET (masked for security)" : "NOT SET"
);
console.log("VERCEL:", process.env.VERCEL);
console.log(
  "PRISMA_CLIENT_ENGINE_TYPE:",
  process.env.PRISMA_CLIENT_ENGINE_TYPE
);

// Force environment variables if they're not set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    "postgresql://buildxpertuser:Madalina123@178.62.45.226:5432/buildxpert";
  console.log("Force set DATABASE_URL");
}

if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL =
    "postgresql://buildxpertuser:Madalina123@178.62.45.226:5432/buildxpert";
  console.log("Force set DIRECT_URL");
}

// Explicitly set variables to disable data proxy
process.env.PRISMA_CLIENT_ENGINE_TYPE = "binary";
console.log("Force set PRISMA_CLIENT_ENGINE_TYPE=binary");

// Explicitly prevent data proxy
process.env.PRISMA_GENERATE_DATAPROXY = "false";
console.log("Force set PRISMA_GENERATE_DATAPROXY=false");

// Remove any leftover data proxy variables
delete process.env.PRISMA_DATA_PROXY_URL;
console.log("Deleted PRISMA_DATA_PROXY_URL if it existed");

// Path to the .env file for Next.js
const envPath = path.join(process.cwd(), ".env");

// Create a .env file with our variables
try {
  const envContent = `
DATABASE_URL=postgresql://buildxpertuser:Madalina123@178.62.45.226:5432/buildxpert
DIRECT_URL=postgresql://buildxpertuser:Madalina123@178.62.45.226:5432/buildxpert
PRISMA_CLIENT_ENGINE_TYPE=binary
PRISMA_GENERATE_DATAPROXY=false
`;
  fs.writeFileSync(envPath, envContent, "utf8");
  console.log("Created .env file with database connection variables");
} catch (err) {
  console.error("Error creating .env file:", err);
}

// Create a .env.production file as well
try {
  fs.writeFileSync(
    path.join(process.cwd(), ".env.production"),
    envContent,
    "utf8"
  );
  console.log("Created .env.production file with same variables");
} catch (err) {
  console.error("Error creating .env.production file:", err);
}

// Run native npm commands instead of relying on package.json scripts
try {
  console.log(
    "Attempting to direct generate Prisma client with --no-engine flag"
  );
  execSync("npx prisma generate --no-engine", { stdio: "inherit" });
} catch (err) {
  console.error("Error manually generating Prisma client:", err);
}

// Load and write to prisma file if needed
try {
  const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
  let schema = fs.readFileSync(schemaPath, "utf8");

  // Make sure direct URL is configured
  if (!schema.includes("directUrl")) {
    schema = schema.replace(
      "datasource db {",
      'datasource db {\n  directUrl    = env("DIRECT_URL")'
    );
    fs.writeFileSync(schemaPath, schema, "utf8");
    console.log("Updated schema.prisma to include directUrl");
  }

  // Remove any previewFeatures
  if (schema.includes("previewFeatures")) {
    schema = schema.replace(
      /previewFeatures\s*=\s*\[[^\]]*\]/g,
      "previewFeatures = []"
    );
    fs.writeFileSync(schemaPath, schema, "utf8");
    console.log("Updated schema.prisma to have empty previewFeatures");
  }
} catch (err) {
  console.error("Error updating schema.prisma:", err);
}

console.log("===============================================");
