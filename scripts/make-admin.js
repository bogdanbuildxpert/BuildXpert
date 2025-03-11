const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcrypt");
const prisma = new PrismaClient();

async function makeAdmin() {
  try {
    console.log("Starting admin user creation/update process...");

    const email = "bogdanhutuleac@outlook.com";

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // User exists, update role to ADMIN
      const updatedUser = await prisma.user.update({
        where: { email },
        data: { role: "ADMIN" },
      });

      console.log(`✅ User ${email} has been updated to ADMIN role.`);
      console.log("User details:", {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        emailVerified: updatedUser.emailVerified,
      });
    } else {
      // User doesn't exist, create a new admin user
      // Generate a random password
      const password = Math.random().toString(36).slice(-10);
      const hashedPassword = await hash(password, 10);

      const newUser = await prisma.user.create({
        data: {
          name: "Bogdan Hutuleac",
          email,
          password: hashedPassword,
          role: "ADMIN",
          emailVerified: new Date(), // Mark as already verified
        },
      });

      console.log(`✅ New ADMIN user created with email: ${email}`);
      console.log("User details:", {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        emailVerified: newUser.emailVerified,
      });
      console.log(`⚠️ Temporary password: ${password}`);
      console.log("Please change this password immediately after logging in!");
    }
  } catch (error) {
    console.error("❌ Error making admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
makeAdmin();
