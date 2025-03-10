// Script to add mock job data for testing
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function addMockJobs() {
  try {
    console.log("Adding mock job data...");

    // First, get the admin user to use as the poster
    const adminUser = await prisma.user.findFirst({
      where: {
        role: "ADMIN",
      },
    });

    if (!adminUser) {
      console.error(
        "No admin user found. Please run the check-admin.js script first."
      );
      return;
    }

    console.log(
      `Using admin user ${adminUser.name} (${adminUser.email}) as job poster`
    );

    // Define mock job data
    const mockJobs = [
      {
        title: "Senior Construction Manager",
        description:
          "We are looking for an experienced Construction Manager to oversee large-scale commercial building projects. The ideal candidate has 7+ years of experience managing complex construction projects and a strong understanding of building codes and regulations.",
        location: "New York, NY",
        salary: 120000,
        type: "FULL_TIME",
        status: "OPEN",
        posterId: adminUser.id,
      },
      {
        title: "Residential Electrician",
        description:
          "Seeking a licensed electrician for residential projects. Responsibilities include installing, maintaining, and repairing electrical systems in homes. Must have 3+ years of experience and valid electrician license.",
        location: "Chicago, IL",
        salary: 75000,
        type: "FULL_TIME",
        status: "OPEN",
        posterId: adminUser.id,
      },
      {
        title: "Part-Time Carpenter",
        description:
          "Looking for a skilled carpenter to join our team on a part-time basis. Projects include custom cabinetry, furniture repair, and finish carpentry. Flexible hours, perfect for experienced carpenters seeking supplemental income.",
        location: "Austin, TX",
        salary: 40000,
        type: "PART_TIME",
        status: "OPEN",
        posterId: adminUser.id,
      },
      {
        title: "HVAC Technician - Contract",
        description:
          "Contract position for HVAC installation and maintenance on a new office building project. 6-month contract with possibility of extension. EPA certification required.",
        location: "Denver, CO",
        salary: 85000,
        type: "CONTRACT",
        status: "OPEN",
        posterId: adminUser.id,
      },
      {
        title: "Construction Site Safety Officer",
        description:
          "Temporary position for a certified Safety Officer to oversee safety protocols on a large construction site. OSHA certification required. Position duration is approximately 3 months.",
        location: "Seattle, WA",
        salary: 65000,
        type: "TEMPORARY",
        status: "OPEN",
        posterId: adminUser.id,
      },
      {
        title: "Project Manager - Commercial Renovation",
        description:
          "Seeking an experienced Project Manager to oversee the renovation of a 50,000 sq ft commercial space. Responsibilities include budget management, scheduling, and coordinating with subcontractors. PMP certification preferred.",
        location: "Miami, FL",
        salary: 110000,
        type: "FULL_TIME",
        status: "OPEN",
        posterId: adminUser.id,
      },
      {
        title: "Plumbing Apprentice",
        description:
          "Great opportunity for someone looking to start a career in plumbing. Will work alongside experienced plumbers on residential and light commercial projects. No experience necessary, but must have high school diploma or GED.",
        location: "Portland, OR",
        salary: 45000,
        type: "FULL_TIME",
        status: "OPEN",
        posterId: adminUser.id,
      },
      {
        title: "Interior Designer - Home Renovations",
        description:
          "Seeking a creative Interior Designer to work with clients on home renovation projects. Must have a portfolio demonstrating residential design experience and knowledge of current design trends.",
        location: "Los Angeles, CA",
        salary: 80000,
        type: "FULL_TIME",
        status: "OPEN",
        posterId: adminUser.id,
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
      `Successfully added ${createdJobs.length} mock jobs to the database:`
    );
    createdJobs.forEach((job, index) => {
      console.log(`${index + 1}. ${job.title} (${job.type}) - ${job.location}`);
    });
  } catch (error) {
    console.error("Error adding mock jobs:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
addMockJobs();
