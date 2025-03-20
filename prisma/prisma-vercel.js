// This script ensures that the correct DATABASE_URL is used on Vercel
const fs = require("fs");
const path = require("path");

// Get the schema path
const schemaPath = path.join(__dirname, "schema.prisma");

try {
  // Read the current schema
  let schema = fs.readFileSync(schemaPath, "utf8");

  // Check if we're on Vercel
  if (process.env.VERCEL) {
    console.log("Running on Vercel, ensuring direct database connection");

    // Ensure previewFeatures is empty
    if (schema.includes("previewFeatures =")) {
      schema = schema.replace(
        /previewFeatures = \[.*?\]/,
        "previewFeatures = []"
      );
    }

    // Write the updated schema
    fs.writeFileSync(schemaPath, schema, "utf8");
    console.log("Successfully updated schema.prisma for Vercel deployment");
  } else {
    console.log("Not running on Vercel, skipping schema modifications");
  }
} catch (error) {
  console.error("Error modifying schema.prisma:", error);
  process.exit(1);
}
