const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function makeBogdanAdmin() {
  try {
    console.log("Checking for user with email bogdanhutuleac@outlook.com...");

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: "bogdanhutuleac@outlook.com" },
    });

    if (user) {
      console.log("User found:", user);

      // Update user role to ADMIN
      user = await prisma.user.update({
        where: { email: "bogdanhutuleac@outlook.com" },
        data: { role: "ADMIN" },
      });

      console.log("✅ User role updated to ADMIN:", user);
    } else {
      console.log("User not found. Creating new admin user...");

      // Create new admin user
      user = await prisma.user.create({
        data: {
          name: "Bogdan Hutuleac",
          email: "bogdanhutuleac@outlook.com",
          password:
            "$2a$10$GQKILTvY8U.ZQiPVf0sE3.hB.vFwxXGnzGgYo.lM1yvmXUYFJRwJi", // hashed password for "admin123"
          role: "ADMIN",
        },
      });

      console.log("✅ New admin user created:", user);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
makeBogdanAdmin();
