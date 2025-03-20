// Reset Database Script
// This script deletes all data from all tables in the database
// Run with: node scripts/reset-db.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Starting database reset...");

  try {
    // Delete all records from each table in the correct order to avoid foreign key constraint issues

    // Delete Review records first as they reference other tables
    await prisma.review.deleteMany();
    console.log("✓ Deleted all Review records");

    // Delete Material records
    await prisma.material.deleteMany();
    console.log("✓ Deleted all Material records");

    // Delete Task records
    await prisma.task.deleteMany();
    console.log("✓ Deleted all Task records");

    // Delete Project records
    await prisma.project.deleteMany();
    console.log("✓ Deleted all Project records");

    // Delete Service records
    await prisma.service.deleteMany();
    console.log("✓ Deleted all Service records");

    // Delete Job records
    await prisma.job.deleteMany();
    console.log("✓ Deleted all Job records");

    // Delete Contact records
    await prisma.contact.deleteMany();
    console.log("✓ Deleted all Contact records");

    // Delete EmailTemplate records
    await prisma.emailTemplate.deleteMany();
    console.log("✓ Deleted all EmailTemplate records");

    // Delete User records last since many tables reference it
    await prisma.user.deleteMany();
    console.log("✓ Deleted all User records");

    console.log("Database reset complete! All data has been deleted.");
  } catch (error) {
    console.error("Error resetting database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
