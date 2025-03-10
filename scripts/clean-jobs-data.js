// Script to clean all jobs data from the database
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function cleanJobsData() {
  try {
    console.log("Starting database cleanup process...");

    // First, delete all messages related to jobs
    console.log("Deleting all messages...");
    const deletedMessages = await prisma.message.deleteMany();
    console.log(`Successfully deleted ${deletedMessages.count} messages.`);

    // Then, delete all jobs
    console.log("Deleting all jobs...");
    const deletedJobs = await prisma.job.deleteMany();
    console.log(`Successfully deleted ${deletedJobs.count} jobs.`);

    console.log("Database cleanup completed successfully!");
  } catch (error) {
    console.error("Error cleaning jobs data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
cleanJobsData();
