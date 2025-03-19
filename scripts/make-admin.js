const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcrypt");
const prisma = new PrismaClient();

const EMAIL_TO_MAKE_ADMIN = "bogdanhutuleac@outlook.com";

async function main() {
  console.log(`Attempting to make ${EMAIL_TO_MAKE_ADMIN} an admin...`);

  // Check if the user exists
  const user = await prisma.user.findUnique({
    where: { email: EMAIL_TO_MAKE_ADMIN },
  });

  if (!user) {
    console.log(
      `User with email ${EMAIL_TO_MAKE_ADMIN} does not exist in the database.`
    );
    return;
  }

  // Update the user's role to ADMIN
  const updatedUser = await prisma.user.update({
    where: { email: EMAIL_TO_MAKE_ADMIN },
    data: { role: "ADMIN" },
  });

  console.log(
    `Successfully updated user ${updatedUser.email} to role: ${updatedUser.role}`
  );
  console.log("Update details:", {
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
    updatedAt: updatedUser.updatedAt,
  });
}

main()
  .catch((e) => {
    console.error("Error updating user role:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
