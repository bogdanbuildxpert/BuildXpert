// Script to manually verify a user's email in the database
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

async function main() {
  // Get the email from command line arguments
  const email = process.argv[2];

  if (!email) {
    console.error(
      "❌ Error: Email address required. Usage: node scripts/verify-user.js user@example.com"
    );
    process.exit(1);
  }

  console.log(`🔍 Attempting to verify email for: ${email}`);

  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      process.exit(1);
    }

    console.log("User found:", {
      id: user.id,
      name: user.name,
      email: user.email,
      verified: user.emailVerified ? "Yes" : "No",
    });

    if (user.emailVerified) {
      console.log(`✅ User ${email} is already verified. No action needed.`);
      process.exit(0);
    }

    // Update the user's emailVerified field to the current date
    const updated = await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    console.log(`✅ Successfully verified email for: ${email}`);
    console.log("User data:", {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      verifiedAt: updated.emailVerified,
    });
  } catch (error) {
    console.error("❌ Error verifying user:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
