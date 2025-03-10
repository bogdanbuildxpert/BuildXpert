// Script to check and ensure admin privileges for a specific user
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkAndEnsureAdmin() {
  try {
    console.log("Checking admin status for bogdanhutuleac@outlook.com...");

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: {
        email: "bogdanhutuleac@outlook.com",
      },
    });

    if (!user) {
      console.log("User not found. Creating admin user...");

      // Create the admin user if they don't exist
      const newUser = await prisma.user.create({
        data: {
          name: "Bogdan Hutuleac",
          email: "bogdanhutuleac@outlook.com",
          password: "admin123", // You should change this to a secure password
          role: "ADMIN",
        },
      });

      console.log("Admin user created successfully:", newUser);
      return;
    }

    // Check if the user is already an admin
    if (user.role === "ADMIN") {
      console.log("User is already an administrator.");
      console.log("User details:", user);
      return;
    }

    // Update the user to be an admin
    const updatedUser = await prisma.user.update({
      where: {
        email: "bogdanhutuleac@outlook.com",
      },
      data: {
        role: "ADMIN",
      },
    });

    console.log("User has been updated to administrator role:", updatedUser);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
checkAndEnsureAdmin();
