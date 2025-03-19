// PostgreSQL notification functionality
// This is a basic implementation - modify according to your needs
import { Pool, Client } from "pg";
import { Server } from "socket.io";
import { Socket } from "socket.io";

// Socket.io instance
let io: Server;
// PostgreSQL notification client
let notifyClient: Client | null = null;

interface ConnectionConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  database: string;
  ssl: boolean | { rejectUnauthorized: boolean };
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  jobId: string;
  content: string;
  createdAt: string;
}

// Parse the DATABASE_URL to ensure proper formatting
function parseConnectionString(connectionString?: string): ConnectionConfig {
  try {
    // If it's already a connection object, return it
    if (typeof connectionString === "object") return connectionString as ConnectionConfig;

    // If connectionString is undefined or null, use default values
    if (!connectionString) {
      console.warn(
        "DATABASE_URL is not defined, using default connection settings"
      );
      return {
        user: "postgres",
        password: "Madalina123",
        host: "localhost",
        port: 5432,
        database: "buildxpert",
        ssl: false,
      };
    }

    console.log(
      "Using DATABASE_URL:",
      connectionString.replace(/:[^:@]+@/, ":****@")
    ); // Log URL with password masked

    // Extract components from the connection string
    const match = connectionString.match(
      /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/
    );

    if (match) {
      const [, user, password, host, port, database] = match;
      return {
        user,
        password,
        host,
        port: parseInt(port, 10),
        database: database.split("?")[0],
        ssl:
          process.env.NODE_ENV === "production"
            ? { rejectUnauthorized: false }
            : false,
      };
    }

    // If the regex doesn't match, use default values
    console.warn(
      "Could not parse DATABASE_URL, using default connection settings"
    );
    return {
      user: "postgres",
      password: "Madalina123",
      host: "localhost",
      port: 5432,
      database: "buildxpert",
      ssl: false,
    };
  } catch (error) {
    console.error("Error parsing connection string:", error);
    // Return default connection settings on error
    return {
      user: "postgres",
      password: "Madalina123",
      host: "localhost",
      port: 5432,
      database: "buildxpert",
      ssl: false,
    };
  }
}

// Create a connection pool using the DATABASE_URL from your .env file
const connectionConfig = parseConnectionString(process.env.DATABASE_URL);
const pool = new Pool(connectionConfig);

// Function to initialize Socket.IO server
function initSocketServer(server: Server) {
  // Use a more compatible configuration for Socket.IO
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Use only polling to avoid WebSocket issues
    transports: ["polling"],
    // Don't try to upgrade to WebSocket for now
    allowUpgrades: false,
    pingTimeout: 60000,
    pingInterval: 25000,
    cookie: false,
  });

  console.log("Socket.IO server initialized with polling transport only");

  io.on("connection", (socket: Socket) => {
    console.log("Client connected with ID:", socket.id);

    // Handle user joining a room (for private messaging)
    socket.on("join", (userId: string) => {
      if (userId) {
        socket.join(userId);
        console.log(
          `User ${userId} joined their private room with socket ID ${socket.id}`
        );
      }
    });

    // Handle new message event
    socket.on("send_message", async (message: Message) => {
      try {
        console.log("Received send_message event:", message);
        // Emit to the sender and receiver rooms
        if (message.senderId && message.receiverId) {
          io.to(message.receiverId).emit("new_message", message);
          io.to(message.senderId).emit("new_message", message);
          console.log(
            `Message sent from ${message.senderId} to ${message.receiverId}`
          );
        }
      } catch (error) {
        console.error("Error handling send_message event:", error);
      }
    });

    // Handle marking messages as read
    socket.on("mark_read", (data: { jobId: string; readBy: string; senderId: string }) => {
      try {
        console.log("Received mark_read event:", data);
        if (data.jobId && data.readBy && data.senderId) {
          // Notify the sender that their messages have been read
          io.to(data.senderId).emit("messages_read", {
            jobId: data.jobId,
            readBy: data.readBy,
          });
          console.log(
            `Messages in job ${data.jobId} marked as read by ${data.readBy}`
          );
        }
      } catch (error) {
        console.error("Error handling mark_read event:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected with ID:", socket.id);
    });
  });

  return io;
}

// Initialize PostgreSQL LISTEN/NOTIFY
async function initPgNotify() {
  if (notifyClient) {
    // If client exists but is not connected, try to reconnect
    if (notifyClient.connection.stream.readyState !== "open") {
      console.log(
        "PostgreSQL notification client disconnected, attempting to reconnect..."
      );
      try {
        await notifyClient.end();
        notifyClient = null;
      } catch (err) {
        console.error("Error closing existing client:", err);
      }
    } else {
      console.log("PostgreSQL notification client already connected");
      return true;
    }
  }

  try {
    console.log("Initializing PostgreSQL notification client...");
    notifyClient = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    // Add event listeners for connection status
    notifyClient.on("error", (err) => {
      console.error("PostgreSQL notification client error:", err);
      // Schedule reconnection
      setTimeout(() => {
        console.log(
          "Attempting to reconnect PostgreSQL notification client..."
        );
        initPgNotify();
      }, 5000);
    });

    notifyClient.on("end", () => {
      console.log("PostgreSQL notification client disconnected");
      // Schedule reconnection
      setTimeout(() => {
        console.log(
          "Attempting to reconnect PostgreSQL notification client..."
        );
        initPgNotify();
      }, 5000);
    });

    await notifyClient.connect();
    console.log("PostgreSQL notification client connected successfully");

    // Listen for new message notifications
    await notifyClient.query("LISTEN new_message");
    console.log("Listening for new_message notifications");

    // Listen for message read notifications
    await notifyClient.query("LISTEN messages_read");
    console.log("Listening for messages_read notifications");

    notifyClient.on("notification", async (msg) => {
      if (!io) {
        console.error("Socket.IO not initialized");
        return;
      }

      try {
        console.log(`Received notification on channel: ${msg.channel}`);
        let payload;

        try {
          payload = JSON.parse(msg.payload || "{}");
          console.log("Parsed notification payload:", payload);
        } catch (parseError) {
          console.error("Error parsing notification payload:", parseError);
          console.log("Raw payload:", msg.payload);
          return;
        }

        if (msg.channel === "new_message") {
          console.log("Processing new_message notification:", payload);

          // Get the full message with sender and receiver details
          const client = await pool.connect();
          try {
            const result = await client.query(
              `
              SELECT m.*, 
                s.id as "senderId", s.name as "senderName", s.email as "senderEmail", s.role as "senderRole",
                r.id as "receiverId", r.name as "receiverName", r.email as "receiverEmail", r.role as "receiverRole"
              FROM "Message" m
              JOIN "User" s ON m."senderId" = s.id
              JOIN "User" r ON m."receiverId" = r.id
              WHERE m.id = $1
            `,
              [payload.id]
            );

            if (result.rows.length > 0) {
              const message = result.rows[0];

              // Format the message to match the expected structure
              const formattedMessage = {
                id: message.id,
                content: message.content,
                isRead: message.isRead,
                senderId: message.senderId,
                receiverId: message.receiverId,
                jobId: message.jobId,
                createdAt: message.createdAt,
                updatedAt: message.updatedAt,
                sender: {
                  id: message.senderId,
                  name: message.senderName,
                  email: message.senderEmail,
                  role: message.senderRole,
                },
                receiver: {
                  id: message.receiverId,
                  name: message.receiverName,
                  email: message.receiverEmail,
                  role: message.receiverRole,
                },
              };

              // Emit to both sender and receiver
              console.log(
                `Emitting new_message to ${message.senderId} and ${message.receiverId}`
              );
              io.to(message.senderId).emit("new_message", formattedMessage);
              io.to(message.receiverId).emit("new_message", formattedMessage);
            } else {
              console.log(`No message found with ID: ${payload.id}`);
            }
          } catch (dbError) {
            console.error(
              "Database error when processing notification:",
              dbError
            );
          } finally {
            client.release();
          }
        } else if (msg.channel === "messages_read") {
          console.log("Processing messages_read notification:", payload);

          // Emit the read receipt to the sender
          io.to(payload.senderId).emit("messages_read", {
            jobId: payload.jobId,
            readBy: payload.receiverId,
          });
        }
      } catch (error) {
        console.error("Error processing notification:", error);
      }
    });

    return true;
  } catch (error) {
    console.error("Error initializing PostgreSQL notification client:", error);

    // Schedule reconnection
    setTimeout(() => {
      console.log("Attempting to reconnect PostgreSQL notification client...");
      initPgNotify();
    }, 5000);

    return false;
  }
}

// Function to set up PostgreSQL triggers for notifications
async function setupPgNotifyTriggers() {
  let client;
  try {
    console.log("Setting up PostgreSQL triggers for chat notifications...");
    client = await pool.connect();

    // Create function for new message notifications
    await client.query(`
      CREATE OR REPLACE FUNCTION notify_new_message()
      RETURNS TRIGGER AS $$
      DECLARE
        payload JSONB;
      BEGIN
        payload := jsonb_build_object(
          'id', NEW.id,
          'content', NEW.content,
          'senderId', NEW."senderId",
          'receiverId', NEW."receiverId",
          'jobId', NEW."jobId",
          'isRead', NEW."isRead",
          'createdAt', NEW."createdAt",
          'updatedAt', NEW."updatedAt"
        );
        PERFORM pg_notify('new_message', payload::text);
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log("✅ Created notify_new_message function");

    // Create function for message read status notifications
    await client.query(`
      CREATE OR REPLACE FUNCTION notify_message_read()
      RETURNS TRIGGER AS $$
      DECLARE
        payload JSONB;
      BEGIN
        IF OLD."isRead" = false AND NEW."isRead" = true THEN
          payload := jsonb_build_object(
            'id', NEW.id,
            'senderId', NEW."senderId",
            'receiverId', NEW."receiverId",
            'jobId', NEW."jobId"
          );
          PERFORM pg_notify('messages_read', payload::text);
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log("✅ Created notify_message_read function");

    // Drop existing triggers if they exist - one by one
    await client.query(
      `DROP TRIGGER IF EXISTS message_insert_trigger ON "Message";`
    );
    console.log("✅ Dropped message_insert_trigger if it existed");

    await client.query(
      `DROP TRIGGER IF EXISTS message_update_trigger ON "Message";`
    );
    console.log("✅ Dropped message_update_trigger if it existed");

    // Create trigger for new messages
    await client.query(`
      CREATE TRIGGER message_insert_trigger
      AFTER INSERT ON "Message"
      FOR EACH ROW
      EXECUTE FUNCTION notify_new_message();
    `);

    console.log("✅ Created message_insert_trigger");

    // Create trigger for message read status updates
    await client.query(`
      CREATE TRIGGER message_update_trigger
      AFTER UPDATE ON "Message"
      FOR EACH ROW
      EXECUTE FUNCTION notify_message_read();
    `);

    console.log("✅ Created message_update_trigger");
    console.log("PostgreSQL triggers set up successfully");
  } catch (error) {
    console.error("Error setting up PostgreSQL triggers:", error);
    console.log(
      "Continuing without database triggers. Some real-time features may not work."
    );
    // Don't throw the error - allow the application to continue
  } finally {
    if (client) client.release();
  }
}

// Function to listen for notifications on a specific channel
function listen(channel: string, callback: (payload: string) => void) {
  try {
    const client = new Pool(connectionConfig);

    client
      .connect()
      .then((client) => {
        client.query(`LISTEN ${channel}`);
        client.on("notification", (msg) => {
          try {
            callback(msg.payload);
          } catch (error) {
            console.error(
              `Error in notification callback for channel ${channel}:`,
              error
            );
          }
        });

        // Handle connection errors
        client.on("error", (err) => {
          console.error(
            `PostgreSQL connection error on channel ${channel}:`,
            err
          );
          // Try to reconnect after a delay
          setTimeout(() => listen(channel, callback), 5000);
        });
      })
      .catch((err) => {
        console.error(
          `Error connecting to PostgreSQL for notifications on channel ${channel}:`,
          err
        );
        // Try to reconnect after a delay
        setTimeout(() => listen(channel, callback), 5000);
      });
  } catch (error) {
    console.error(
      `Error setting up PostgreSQL listener for channel ${channel}:`,
      error
    );
    // Try to reconnect after a delay
    setTimeout(() => listen(channel, callback), 5000);
  }
}

// Function to send a notification on a specific channel
async function notify(channel: string, payload: string) {
  const client = await pool.connect();
  try {
    await client.query(`NOTIFY ${channel}, '${payload}'`);
  } finally {
    client.release();
  }
}

// Function to mark messages as read
async function markMessagesAsRead(jobId: string, userId: string) {
  try {
    const client = await pool.connect();
    try {
      // Update all messages where the user is the receiver
      const result = await client.query(
        `
        UPDATE "Message"
        SET "isRead" = true
        WHERE "jobId" = $1 AND "receiverId" = $2 AND "isRead" = false
        RETURNING "id", "senderId"
      `,
        [jobId, userId]
      );

      // If messages were updated, emit notifications
      if (result.rows.length > 0) {
        console.log(
          `Marked ${result.rows.length} messages as read for user ${userId} in job ${jobId}`
        );

        // Get unique sender IDs
        const senderIds = [...new Set(result.rows.map((row) => row.senderId))];

        // Notify each sender that their messages have been read
        if (io) {
          senderIds.forEach((senderId) => {
            io.to(senderId).emit("messages_read", {
              jobId,
              readBy: userId,
            });
            console.log(
              `Notified sender ${senderId} that messages were read by ${userId}`
            );
          });
        }
      }

      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return false;
  }
}

module.exports = {
  listen,
  notify,
  initSocketServer,
  initPgNotify,
  setupPgNotifyTriggers,
  markMessagesAsRead,
};
