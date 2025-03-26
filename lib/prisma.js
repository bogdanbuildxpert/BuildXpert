// Import prisma-config first to ensure environment is correctly set up
require("./prisma-config");
const { PrismaClient } = require("@prisma/client");
const { Server: SocketServer } = require("socket.io");

// Socket.io instance for notifications
let io = null;

// Initialize Socket.IO server
function initSocketServer(server) {
  io = new SocketServer(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Join user-specific room when client connects
    socket.on("join", (userId) => {
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
  `[prisma.js] Environment: ${
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
    "[prisma.js] Using Data Proxy connection (prisma:// protocol detected)"
  );
} else {
  console.log(
    "[prisma.js] Using direct database connection (postgresql:// protocol)"
  );
}

// Create Prisma client with options
function createPrismaClient() {
  try {
    // Configure connection options based on URL type
    const connectionOptions = {
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    };

    // Configure connection pooling for pgBouncer on serverless
    if (!useDataProxy && (isVercelProduction || isVercelPreview)) {
      console.log(
        "[prisma.js] Configuring connection pooling for serverless environment"
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
    console.log("[prisma.js] Creating PrismaClient...");
    const prisma = new PrismaClient(connectionOptions);

    // Connect to validate the connection works
    console.log("[prisma.js] Connecting to database...");
    prisma
      .$connect()
      .then(() => console.log("[prisma.js] Successfully connected to database"))
      .catch((err) =>
        console.error("[prisma.js] Failed to connect to database:", err)
      );

    return prisma;
  } catch (error) {
    console.error("[prisma.js] Failed to create Prisma client:", error);

    // Return a dummy client that won't crash the application
    return {
      $connect: async () => {},
      $disconnect: async () => {},
      // Add other dummy methods as needed
    };
  }
}

// Create the Prisma client
const prisma = createPrismaClient();

// Function to mark messages as read using Prisma instead of direct SQL
async function markMessagesAsRead(jobId, receiverId) {
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
    // Don't throw an error that would break the flow
    return false;
  }
}

// Export the Prisma client and functions
module.exports = {
  prisma,
  initSocketServer,
  markMessagesAsRead,
};
