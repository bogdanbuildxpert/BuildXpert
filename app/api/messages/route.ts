import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET messages for a specific job and user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get("jobId");
    const userId = searchParams.get("userId");

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // If userId is provided, filter messages where the user is either sender or receiver
    if (userId) {
      let messages;

      // First, check if the user exists and get their role
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Get the job to check if it exists and get the poster ID
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: { id: true, posterId: true },
      });

      if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }

      const isAdmin = user.role === "ADMIN";
      const isJobPoster = userId === job.posterId;

      // If the user is the job poster, show messages between them and any admin
      if (isJobPoster) {
        // Get all admins in a single query
        const admins = await prisma.user.findMany({
          where: { role: "ADMIN" },
          select: { id: true },
        });

        const adminIds = admins.map((admin: { id: string }) => admin.id);

        messages = await prisma.message.findMany({
          where: {
            jobId,
            OR: [
              {
                senderId: userId,
                receiverId: { in: adminIds },
              },
              {
                senderId: { in: adminIds },
                receiverId: userId,
              },
            ],
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            receiver: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        });

        // Create response with cache headers
        const response = NextResponse.json(messages);
        // Cache for 20 seconds - this allows for new messages while reducing load
        response.headers.set("Cache-Control", "public, max-age=20");
        return response;
      }
      // If the user is an admin, show messages between them and the job poster
      else if (isAdmin) {
        messages = await prisma.message.findMany({
          where: {
            jobId,
            OR: [
              {
                senderId: userId,
                receiverId: job.posterId,
              },
              {
                senderId: job.posterId,
                receiverId: userId,
              },
            ],
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            receiver: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        });

        // Create response with cache headers
        const response = NextResponse.json(messages);
        // Cache for 20 seconds
        response.headers.set("Cache-Control", "public, max-age=20");
        return response;
      } else {
        // If the user is neither the job poster nor an admin, they shouldn't see any messages
        return NextResponse.json([]);
      }
    }

    // If no userId is provided, return all messages for the job (admin view)
    const messages = await prisma.message.findMany({
      where: {
        jobId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Create response with cache headers
    const response = NextResponse.json(messages);
    // Cache for 20 seconds
    response.headers.set("Cache-Control", "public, max-age=20");
    return response;
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST a new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, senderId, receiverId, jobId } = body;

    // Validate required fields
    if (!content || !senderId || !receiverId || !jobId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if the job exists
    const job = await prisma.job.findUnique({
      where: {
        id: jobId,
      },
      select: {
        id: true,
        posterId: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check if the sender and receiver exist
    const [sender, receiver] = await Promise.all([
      prisma.user.findUnique({
        where: { id: senderId },
        select: { id: true, role: true },
      }),
      prisma.user.findUnique({
        where: { id: receiverId },
        select: { id: true, role: true },
      }),
    ]);

    if (!sender || !receiver) {
      return NextResponse.json(
        { error: "Sender or receiver not found" },
        { status: 404 }
      );
    }

    // Validate messaging rules:
    // 1. If sender is job poster, receiver must be an admin
    // 2. If sender is admin, receiver must be job poster
    const isAdmin = sender.role === "ADMIN";
    const isJobPoster = senderId === job.posterId;
    const receiverIsAdmin = receiver.role === "ADMIN";
    const receiverIsJobPoster = receiverId === job.posterId;

    if (isJobPoster && !receiverIsAdmin) {
      return NextResponse.json(
        { error: "Job posters can only message administrators" },
        { status: 403 }
      );
    }

    if (isAdmin && !receiverIsJobPoster) {
      return NextResponse.json(
        { error: "Administrators can only message job posters" },
        { status: 403 }
      );
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        content,
        senderId,
        receiverId,
        jobId,
        isRead: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}
