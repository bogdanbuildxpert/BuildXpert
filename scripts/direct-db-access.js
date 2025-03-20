const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

async function main() {
  console.log("Connecting to database directly using Prisma...");
  console.log(`Database URL: ${process.env.DATABASE_URL.substring(0, 20)}...`);

  const prisma = new PrismaClient();

  try {
    // Connect to the database
    await prisma.$connect();
    console.log("✅ Connected successfully!");

    // Example query - count users
    const userCount = await prisma.user.count();
    console.log(`✅ Query successful! User count: ${userCount}`);

    // Example query - list all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    console.log("\nUsers in database:");
    console.table(users);

    // Example query - count projects
    const projectCount = await prisma.project.count();
    console.log(`\nProject count: ${projectCount}`);

    // You can add more custom queries here
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
  } finally {
    await prisma.$disconnect();
    console.log("Database connection closed");
  }
}

main()
  .then(() => console.log("Done"))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
