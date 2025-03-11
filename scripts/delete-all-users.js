const { PrismaClient } = require("@prisma/client");
const readline = require("readline");

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function deleteAllUsers() {
  console.log(
    "\x1b[31m%s\x1b[0m",
    "⚠️  WARNING: This will permanently delete ALL users and their related data! ⚠️"
  );
  console.log("\x1b[31m%s\x1b[0m", "This action cannot be undone.");

  // Ask for confirmation
  rl.question(
    '\x1b[33mType "DELETE ALL USERS" to confirm: \x1b[0m',
    async (answer) => {
      if (answer !== "DELETE ALL USERS") {
        console.log(
          "\x1b[32mOperation cancelled. No users were deleted.\x1b[0m"
        );
        rl.close();
        await prisma.$disconnect();
        return;
      }

      try {
        console.log("Starting deletion process...");

        // Begin transaction to ensure all operations succeed or fail together
        const result = await prisma.$transaction(async (tx) => {
          // 1. Delete all messages
          const deletedMessages = await tx.message.deleteMany({});
          console.log(`Deleted ${deletedMessages.count} messages`);

          // 2. Delete all reviews
          const deletedReviews = await tx.review.deleteMany({});
          console.log(`Deleted ${deletedReviews.count} reviews`);

          // 3. Delete all services
          const deletedServices = await tx.service.deleteMany({});
          console.log(`Deleted ${deletedServices.count} services`);

          // 4. Delete materials from projects
          const deletedMaterials = await tx.material.deleteMany({});
          console.log(`Deleted ${deletedMaterials.count} materials`);

          // 5. Delete tasks from projects
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

          return deletedUsers.count;
        });

        console.log(
          "\x1b[32m%s\x1b[0m",
          `✅ Successfully deleted all ${result} users and their related data.`
        );
      } catch (error) {
        console.error("\x1b[31m%s\x1b[0m", "❌ Error deleting users:");
        console.error(error);
      } finally {
        rl.close();
        await prisma.$disconnect();
      }
    }
  );
}

deleteAllUsers();
