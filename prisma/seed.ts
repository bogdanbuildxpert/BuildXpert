import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clean up existing data
  await prisma.review.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.material.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.user.deleteMany({});

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      name: "Bogdan Hutuleac",
      email: "bogdanhutuleac@outlook.com",
      password: "admin123", // In production, use hashed passwords
      role: "ADMIN",
    },
  });

  // Create a sample client user
  const client = await prisma.user.create({
    data: {
      name: "Sample Client",
      email: "client@example.com",
      password: "client123",
      role: "CLIENT",
    },
  });

  // Create projects
  const project1 = await prisma.project.create({
    data: {
      title: "Modern House Renovation",
      description:
        "Complete renovation of a 3-bedroom house including kitchen and bathrooms",
      budget: 150000,
      startDate: new Date("2023-06-01"),
      endDate: new Date("2023-12-31"),
      status: "IN_PROGRESS",
      location: "New York, NY",
      clientId: client.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      title: "Office Building Construction",
      description: "New 5-story office building construction project",
      budget: 2500000,
      startDate: new Date("2023-08-15"),
      endDate: new Date("2024-10-30"),
      status: "PLANNING",
      location: "Chicago, IL",
      clientId: client.id,
    },
  });

  // Create tasks
  await prisma.task.createMany({
    data: [
      {
        title: "Demolition",
        description: "Remove existing structures and prepare the site",
        startDate: new Date("2023-06-01"),
        endDate: new Date("2023-06-15"),
        status: "COMPLETED",
        priority: "HIGH",
        projectId: project1.id,
      },
      {
        title: "Plumbing Installation",
        description: "Install new plumbing throughout the house",
        startDate: new Date("2023-06-16"),
        endDate: new Date("2023-07-15"),
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        projectId: project1.id,
      },
      {
        title: "Electrical Wiring",
        description: "Update all electrical systems",
        startDate: new Date("2023-06-16"),
        endDate: new Date("2023-07-15"),
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        projectId: project1.id,
      },
      {
        title: "Site Preparation",
        description: "Clear the site and prepare for foundation",
        startDate: new Date("2023-08-15"),
        endDate: new Date("2023-09-15"),
        status: "TODO",
        priority: "HIGH",
        projectId: project2.id,
      },
    ],
  });

  // Create materials
  await prisma.material.createMany({
    data: [
      {
        name: "Lumber",
        quantity: 500,
        unit: "board feet",
        price: 3.5,
        supplier: "ABC Lumber Co",
        projectId: project1.id,
      },
      {
        name: "Drywall",
        quantity: 100,
        unit: "sheets",
        price: 15,
        supplier: "Building Supply Inc",
        projectId: project1.id,
      },
      {
        name: "Concrete",
        quantity: 200,
        unit: "cubic yards",
        price: 125,
        supplier: "Concrete Solutions",
        projectId: project2.id,
      },
    ],
  });

  // Create jobs
  await prisma.job.create({
    data: {
      title: "Experienced Plumber Needed",
      description:
        "Looking for a licensed plumber with at least 5 years of experience",
      location: "New York, NY",
      salary: 75000,
      type: "FULL_TIME",
      status: "OPEN",
      posterId: client.id,
    },
  });

  await prisma.job.create({
    data: {
      title: "Construction Site Manager",
      description:
        "Overseeing day-to-day operations at our Chicago office building project",
      location: "Chicago, IL",
      salary: 95000,
      type: "FULL_TIME",
      status: "OPEN",
      posterId: client.id,
    },
  });

  // Create services
  const service1 = await prisma.service.create({
    data: {
      name: "Plumbing Services",
      description: "Professional plumbing installation and repair",
      price: 85,
      duration: "1-3 days",
      providerId: client.id,
    },
  });

  const service2 = await prisma.service.create({
    data: {
      name: "Electrical Services",
      description: "Licensed electrician for all your electrical needs",
      price: 95,
      duration: "1-5 days",
      providerId: client.id,
    },
  });

  console.log("Database has been seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
