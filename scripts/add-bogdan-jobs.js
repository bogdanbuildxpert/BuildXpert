// Script to add job listings for bogdan@ctrl.fund
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function addBogdanJobs() {
  try {
    console.log("Adding job listings for bogdan@ctrl.fund...");

    // First, check if the user exists
    let user = await prisma.user.findUnique({
      where: {
        email: "bogdan@ctrl.fund",
      },
    });

    // If user doesn't exist, create it
    if (!user) {
      console.log("User bogdan@ctrl.fund not found. Creating user...");
      user = await prisma.user.create({
        data: {
          name: "Bogdan CTRL",
          email: "bogdan@ctrl.fund",
          password: "password123", // You should change this to a secure password
          role: "CLIENT", // Using CLIENT role for this user
        },
      });
      console.log("User created successfully:", user);
    } else {
      console.log(`Using existing user: ${user.name} (${user.email})`);
    }

    // Define mock job data for this user
    const mockJobs = [
      {
        title: "Sustainable Building Consultant",
        description:
          "Looking for a consultant specializing in green building practices and LEED certification. The ideal candidate will have experience with sustainable materials, energy-efficient designs, and environmental impact assessments for commercial buildings.",
        location: "San Francisco, CA",
        status: "PLANNING",
        posterId: user.id,
      },
      {
        title: "Historic Building Restoration Specialist",
        description:
          "Seeking an experienced specialist in historic building restoration. Must have knowledge of traditional building techniques, period-appropriate materials, and experience working with historical preservation committees. Current project involves restoring a 19th-century Victorian mansion.",
        location: "Boston, MA",
        status: "PLANNING",
        posterId: user.id,
      },
      {
        title: "Smart Home Technology Installer",
        description:
          "We are looking for a technician experienced in installing and configuring smart home systems. Knowledge of home automation, security systems, entertainment systems, and IoT device integration required. Must be comfortable working with both new construction and retrofit projects.",
        location: "Austin, TX",
        status: "PLANNING",
        posterId: user.id,
      },
    ];

    // Create the jobs in the database
    const createdJobs = await Promise.all(
      mockJobs.map((job) =>
        prisma.job.create({
          data: job,
        })
      )
    );

    console.log(
      `Successfully added ${createdJobs.length} jobs for ${user.email} to the database:`
    );
    createdJobs.forEach((job, index) => {
      console.log(`${index + 1}. ${job.title} - ${job.location}`);
    });
  } catch (error) {
    console.error("Error adding jobs:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
addBogdanJobs();
