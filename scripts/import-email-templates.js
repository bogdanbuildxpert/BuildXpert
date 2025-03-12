// Script to import email templates from a JSON file into the database
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  console.log("Importing email templates...");

  try {
    // Path to the JSON file
    const filePath = path.join(__dirname, "..", "data", "email-templates.json");

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }

    // Read and parse the JSON file
    const templatesData = JSON.parse(fs.readFileSync(filePath, "utf8"));

    if (!templatesData || templatesData.length === 0) {
      console.log("No email templates found in the JSON file.");
      return;
    }

    console.log(`Found ${templatesData.length} email templates to import.`);

    // Import each template
    let importedCount = 0;
    for (const template of templatesData) {
      // Extract only the fields we need for the upsert
      const { name, subject, content, description } = template;

      await prisma.emailTemplate.upsert({
        where: { name },
        update: {
          subject,
          content,
          description,
        },
        create: {
          name,
          subject,
          content,
          description: description || null,
        },
      });

      importedCount++;
    }

    console.log(`Successfully imported ${importedCount} email templates.`);
  } catch (error) {
    console.error("Error importing email templates:", error);
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
