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

// Define the connection URL
const connectionUrl =
  "postgresql://buildxpertuser:Madalina123@178.62.45.226:5432/buildxpert";

// Define Supabase URL (you should replace this with your actual Supabase URL)
const supabaseUrl = "https://supabase.example.com";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example";

// Force environment variables
process.env.DATABASE_URL = connectionUrl;
process.env.DIRECT_URL = connectionUrl;
process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = supabaseAnonKey;

// Create .env files with our variables
const envContent = `DATABASE_URL=${connectionUrl}
DIRECT_URL=${connectionUrl}
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}`;

try {
  // Write to .env
  fs.writeFileSync(path.join(process.cwd(), ".env"), envContent, "utf8");
  console.log("Created .env file with database connection variables");

  // Write to .env.production
  fs.writeFileSync(
    path.join(process.cwd(), ".env.production"),
    envContent,
    "utf8"
  );
  console.log("Created .env.production file with same variables");
} catch (err) {
  console.error("Error creating env files:", err);
}

// Update schema.prisma if needed
try {
  const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
  let schema = fs.readFileSync(schemaPath, "utf8");

  // Ensure schema has correct datasource configuration
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

// Generate Prisma Client
try {
  console.log("Generating Prisma Client...");
  execSync("npx prisma generate", { stdio: "inherit" });
  console.log("Successfully generated Prisma Client");
} catch (err) {
  console.error("Failed to generate Prisma Client:", err);
}

console.log("===============================================");
