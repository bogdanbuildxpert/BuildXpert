// Script to export email templates from the database to a JSON file
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  console.log("Exporting email templates...");

  try {
    // Fetch all email templates from the database
    const templates = await prisma.emailTemplate.findMany();

    if (!templates || templates.length === 0) {
      console.log("No email templates found in the database.");
      return;
    }

    console.log(`Found ${templates.length} email templates.`);

    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, "..", "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Write templates to a JSON file
    const filePath = path.join(dataDir, "email-templates.json");
    fs.writeFileSync(filePath, JSON.stringify(templates, null, 2), "utf8");

    console.log(`Email templates exported successfully to ${filePath}`);
  } catch (error) {
    console.error("Error exporting email templates:", error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
