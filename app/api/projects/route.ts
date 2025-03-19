import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET all projects
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tasks: true,
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      title,
      description,
      budget,
      startDate,
      endDate,
      location,
      clientId,
    } = body;

    const project = await prisma.project.create({
      data: {
        title,
        description,
        budget: budget ? parseFloat(budget) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        location,
        clientId,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
