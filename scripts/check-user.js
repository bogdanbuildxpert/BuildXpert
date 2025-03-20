// Script to check database connection and user existence
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

async function main() {
  console.log("=== Database Connection Test ===");
  try {
    console.log("Connecting to database...");
    await prisma.$connect();
    console.log("✅ Connected to database successfully");

    // Check for specific user
    const userEmail = "bogdan@buildxpert.ie";
    console.log(`Checking for user with email: ${userEmail}`);
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (user) {
      console.log("✅ User found:");
      console.log({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      });
    } else {
      console.log("❌ User not found");
    }

    // Count total users
    const userCount = await prisma.user.count();
    console.log(`Total users in database: ${userCount}`);

    // List all users (up to 10)
    console.log("Recent users:");
    const users = await prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
    });

    users.forEach((u) => {
      console.log(
        `- ${u.email} (${u.name || "unnamed"}) - Verified: ${
          u.emailVerified ? "Yes" : "No"
        }`
      );
    });

    // Check email configuration
    console.log("\n=== Email Configuration ===");
    console.log({
      EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST || "Not configured",
      EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT || "Not configured",
      EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER
        ? "Configured"
        : "Not configured",
      EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD
        ? "Configured"
        : "Not configured",
      EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || "Not configured",
    });
  } catch (error) {
    console.error("❌ Database connection error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
