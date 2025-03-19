import { Client } from "pg";
import { Server as SocketServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import pool from "./pg-client";

// Create a dedicated client for LISTEN/NOTIFY
let notifyClient: Client | null = null;
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

// Initialize PostgreSQL LISTEN/NOTIFY
export async function initPgNotify() {
  if (notifyClient) {
    return;
  }

  try {
    notifyClient = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await notifyClient.connect();
    console.log("PostgreSQL notification client connected");

    // Listen for new message notifications
    await notifyClient.query("LISTEN new_message");

    // Listen for message read notifications
    await notifyClient.query("LISTEN messages_read");

    notifyClient.on(
      "notification",
      async (msg: { channel: string; payload?: string }) => {
        if (!io) {
          console.error("Socket.IO not initialized");
          return;
        }

        try {
          const payload = JSON.parse(msg.payload || "{}");

          if (msg.channel === "new_message") {
            // Fetch the new message with user details
            const result = await pool.query(
              `SELECT m.*, 
              json_build_object('id', s.id, 'name', s.name, 'email', s.email, 'role', s.role) as sender,
              json_build_object('id', r.id, 'name', r.name, 'email', r.email, 'role', r.role) as receiver
             FROM "Message" m
             JOIN "User" s ON m."senderId" = s.id
             JOIN "User" r ON m."receiverId" = r.id
             WHERE m.id = $1`,
              [payload.messageId]
            );

            if (result.rows.length > 0) {
              const message = result.rows[0];

              // Emit to both sender and receiver
              io.to(`user_${message.senderId}`).emit("new_message", message);
              io.to(`user_${message.receiverId}`).emit("new_message", message);
            }
          } else if (msg.channel === "messages_read") {
            // Notify about messages being read
            io.to(`user_${payload.senderId}`).emit("messages_read", {
              jobId: payload.jobId,
              readBy: payload.receiverId,
            });
          }
        } catch (error) {
          console.error("Error processing notification:", error);
        }
      }
    );

    // Handle client errors
    notifyClient.on("error", (err: Error) => {
      console.error("PostgreSQL notification client error:", err);
      notifyClient = null;
      // Attempt to reconnect after a delay
      setTimeout(initPgNotify, 5000);
    });
  } catch (error) {
    console.error(
      "Failed to initialize PostgreSQL notification client:",
      error
    );
    notifyClient = null;
    // Attempt to reconnect after a delay
    setTimeout(initPgNotify, 5000);
  }
}

// Create SQL functions and triggers for notifications
export async function setupPgNotifyTriggers() {
  try {
    // Create function to notify on new messages
    await pool.query(`
      CREATE OR REPLACE FUNCTION notify_new_message() RETURNS TRIGGER AS $$
      BEGIN
        PERFORM pg_notify(
          'new_message', 
          json_build_object(
            'messageId', NEW.id,
            'jobId', NEW."jobId",
            'senderId', NEW."senderId",
            'receiverId', NEW."receiverId"
          )::text
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Check if trigger exists before creating
    const triggerCheck = await pool.query(`
      SELECT 1 FROM pg_trigger WHERE tgname = 'message_insert_trigger';
    `);

    if (triggerCheck.rows.length === 0) {
      // Create trigger for new messages
      await pool.query(`
        CREATE TRIGGER message_insert_trigger
        AFTER INSERT ON "Message"
        FOR EACH ROW
        EXECUTE FUNCTION notify_new_message();
      `);
    }

    // Create function to mark messages as read
    await pool.query(`
      CREATE OR REPLACE FUNCTION mark_messages_read(
        p_job_id TEXT,
        p_receiver_id TEXT
      ) RETURNS VOID AS $$
      BEGIN
        UPDATE "Message"
        SET "isRead" = TRUE, "updatedAt" = NOW()
        WHERE "jobId" = p_job_id
          AND "receiverId" = p_receiver_id
          AND "isRead" = FALSE;
          
        PERFORM pg_notify(
          'messages_read',
          json_build_object(
            'jobId', p_job_id,
            'receiverId', p_receiver_id
          )::text
        );
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log("PostgreSQL notification triggers set up successfully");
  } catch (error) {
    console.error("Error setting up PostgreSQL notification triggers:", error);
  }
}

// Export the pool for use in other parts of the application
export { pool };

// Function to mark messages as read
export async function markMessagesAsRead(jobId: string, receiverId: string) {
  try {
    await pool.query("SELECT mark_messages_read($1, $2)", [jobId, receiverId]);
    return true;
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return false;
  }
}

// Clean up connections when the application shuts down
export async function closeConnections() {
  if (notifyClient) {
    try {
      await notifyClient.end();
    } catch (error) {
      console.error("Error closing notification client:", error);
    }
  }

  try {
    await pool.end();
  } catch (error) {
    console.error("Error closing connection pool:", error);
  }
}
