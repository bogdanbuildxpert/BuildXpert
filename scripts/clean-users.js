const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function cleanDatabase() {
  try {
    console.log("Starting database cleanup...");

    // Begin transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // 1. Delete all messages
      const deletedMessages = await tx.message.deleteMany({});
      console.log(`Deleted ${deletedMessages.count} messages`);

      // 2. Delete all reviews
      const deletedReviews = await tx.review.deleteMany({});
      console.log(`Deleted ${deletedReviews.count} reviews`);

      // 3. Delete all services
      const deletedServices = await tx.service.deleteMany({});
      console.log(`Deleted ${deletedServices.count} services`);

      // 4. Delete all materials
      const deletedMaterials = await tx.material.deleteMany({});
      console.log(`Deleted ${deletedMaterials.count} materials`);

      // 5. Delete all tasks
      const deletedTasks = await tx.task.deleteMany({});
      console.log(`Deleted ${deletedTasks.count} tasks`);

      // 6. Delete all projects
      const deletedProjects = await tx.project.deleteMany({});
      console.log(`Deleted ${deletedProjects.count} projects`);

      // 7. Delete all jobs
      const deletedJobs = await tx.job.deleteMany({});
      console.log(`Deleted ${deletedJobs.count} jobs`);

      // 8. Delete all contacts
      const deletedContacts = await tx.contact.deleteMany({});
      console.log(`Deleted ${deletedContacts.count} contacts`);

      // 9. Finally, delete all users
      const deletedUsers = await tx.user.deleteMany({});
      console.log(`Deleted ${deletedUsers.count} users`);
    });

    console.log("✅ Database cleanup completed successfully");
  } catch (error) {
    console.error("❌ Error cleaning database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
cleanDatabase();
