// Import prisma-config first to ensure environment is correctly set up
import "./prisma-config";
import { PrismaClient, Prisma } from "@prisma/client";
import { Server as SocketServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";

// Add prisma to the NodeJS global type
declare global {
  var prisma: PrismaClient | undefined;
}

// Socket.io instance for notifications
let io: SocketServer | null = null;

// Initialize Socket.IO server
export function initSocketServer(server: HttpServer) {
  io = new SocketServer(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log("Client connected:", socket.id);

    // Join user-specific room when client connects
    socket.on("join", (userId: string) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
}

// Check environment variables
const isVercelPreview = process.env.VERCEL_ENV === "preview";
const isVercelProduction =
  process.env.VERCEL === "1" && process.env.NODE_ENV === "production";

// Log environment information
console.log(
  `[prisma.ts] Environment: ${
    isVercelProduction
      ? "Vercel Production"
      : isVercelPreview
      ? "Vercel Preview"
      : "Development"
  }`
);

// Check for connection type
let useDataProxy = false;
if (process.env.DATABASE_URL?.startsWith("prisma://")) {
  useDataProxy = true;
  console.log(
    "[prisma.ts] Using Data Proxy connection (prisma:// protocol detected)"
  );
} else {
  console.log(
    "[prisma.ts] Using direct database connection (postgresql:// protocol)"
  );
}

// Create Prisma client with options
function createPrismaClient() {
  try {
    // Configure connection options based on URL type
    const connectionOptions: any = {
      log: (process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"]) as Prisma.LogLevel[],
    };

    // Configure connection pooling for pgBouncer on serverless
    if (!useDataProxy && (isVercelProduction || isVercelPreview)) {
      console.log(
        "[prisma.ts] Configuring connection pooling for serverless environment"
      );

      // Set max connections and idle timeout for pgBouncer
      const connectionLimit = parseInt(
        process.env.DATABASE_CONNECTION_LIMIT || "5"
      );
      const poolTimeout = parseInt(process.env.DATABASE_POOL_TIMEOUT || "15");

      connectionOptions.datasources = {
        db: {
          url: process.env.DATABASE_URL,
        },
      };

      // Connection pooling settings
      connectionOptions.runtime = {
        engineType: "library",
        connectionPoolOptions: {
          maxSize: connectionLimit,
          idleTimeout: poolTimeout,
          maxUses: 100, // Reset connection after 100 queries
        },
      };
    }

    // Create Prisma client with appropriate configuration
    console.log("[prisma.ts] Creating PrismaClient...");
    const prisma = new PrismaClient(connectionOptions);

    // Connect to validate the connection works
    console.log("[prisma.ts] Connecting to database...");
    prisma
      .$connect()
      .then(() => console.log("[prisma.ts] Successfully connected to database"))
      .catch((err) =>
        console.error("[prisma.ts] Failed to connect to database:", err)
      );

    return prisma;
  } catch (error) {
    console.error("[prisma.ts] Failed to create Prisma client:", error);

    // Return a dummy client that won't crash the application
    return {
      $connect: async () => {},
      $disconnect: async () => {},
      // Add other dummy methods as needed
    } as unknown as PrismaClient;
  }
}

// Prevent multiple instances of Prisma Client in development
export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

// Function to mark messages as read using Prisma instead of direct SQL
export async function markMessagesAsRead(jobId: string, receiverId: string) {
  try {
    // Update messages using Prisma
    await prisma.message.updateMany({
      where: {
        jobId: jobId,
        receiverId: receiverId,
        isRead: false,
      },
      data: {
        isRead: true,
        updatedAt: new Date(),
      },
    });

    // Emit socket event for real-time updates
    if (io) {
      io.to(`user_${receiverId}`).emit("messages_read", {
        jobId: jobId,
        readBy: receiverId,
      });
    }

    return true;
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return false;
  }
}

// Setup Prisma middleware for real-time notifications
prisma.$use(async (params, next) => {
  const result = await next(params);

  // Detect new message creation
  if (params.model === "Message" && params.action === "create") {
    try {
      if (io && result) {
        // Fetch the complete message with user details using Prisma
        const message = await prisma.message.findUnique({
          where: { id: result.id },
          include: {
            sender: {
              select: { id: true, name: true, email: true, role: true },
            },
            receiver: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        });

        if (message) {
          // Emit to both sender and receiver
          io.to(`user_${message.senderId}`).emit("new_message", message);
          io.to(`user_${message.receiverId}`).emit("new_message", message);
        }
      }
    } catch (error) {
      console.error("Error handling message notification:", error);
    }
  }

  return result;
});

export default prisma;
