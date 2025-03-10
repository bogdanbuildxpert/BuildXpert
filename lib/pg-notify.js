// PostgreSQL notification functionality
// This is a basic implementation - modify according to your needs
const { Pool } = require("pg");
const { Server } = require("socket.io");

// Parse the DATABASE_URL to ensure proper formatting
function parseConnectionString(connectionString) {
  try {
    // If it's already a connection object, return it
    if (typeof connectionString === "object") return connectionString;

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

// Socket.io instance
let io;

// Function to initialize Socket.IO server
function initSocketServer(server) {
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

  io.on("connection", (socket) => {
    console.log("Client connected with ID:", socket.id);

    // Handle user joining a room (for private messaging)
    socket.on("join", (userId) => {
      if (userId) {
        socket.join(userId);
        console.log(
          `User ${userId} joined their private room with socket ID ${socket.id}`
        );
      }
    });

    // Handle new message event
    socket.on("send_message", async (message) => {
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
    socket.on("mark_read", (data) => {
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

// Function to initialize PostgreSQL LISTEN/NOTIFY
async function initPgNotify() {
  try {
    // Test the database connection first
    const testClient = await pool.connect();
    testClient.release();

    // Listen for notifications on the 'database_changes' channel
    listen("database_changes", (payload) => {
      try {
        // Broadcast the notification to all connected clients
        if (io) {
          const data = JSON.parse(payload);
          io.emit("database_update", data);
        }
      } catch (error) {
        console.error("Error processing notification payload:", error);
      }
    });

    console.log("PostgreSQL LISTEN/NOTIFY initialized");
    return true;
  } catch (error) {
    console.error("Error initializing PostgreSQL LISTEN/NOTIFY:", error);
    console.log(
      "Continuing without real-time database updates. Some features may not work."
    );
    return false;
  }
}

// Function to set up PostgreSQL triggers for notifications
async function setupPgNotifyTriggers() {
  let client;
  try {
    client = await pool.connect();

    // Check if the function already exists to avoid errors
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'notify_on_change'
      );
    `);

    // Create the function if it doesn't exist
    if (!checkResult.rows[0].exists) {
      // Create a function that will send notifications
      await client.query(`
        CREATE OR REPLACE FUNCTION notify_on_change() RETURNS TRIGGER AS $$
        BEGIN
          PERFORM pg_notify('database_changes', row_to_json(NEW)::text);
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);

      console.log("PostgreSQL notification function created successfully");
    } else {
      console.log("PostgreSQL notification function already exists");
    }

    // You can add triggers for specific tables here
    // Example:
    // await client.query(`
    //   DROP TRIGGER IF EXISTS projects_notify_trigger ON projects;
    //   CREATE TRIGGER projects_notify_trigger
    //   AFTER INSERT OR UPDATE OR DELETE ON projects
    //   FOR EACH ROW EXECUTE PROCEDURE notify_on_change();
    // `);

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
function listen(channel, callback) {
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
async function notify(channel, payload) {
  const client = await pool.connect();
  try {
    await client.query(`NOTIFY ${channel}, '${payload}'`);
  } finally {
    client.release();
  }
}

// Function to mark messages as read
async function markMessagesAsRead(jobId, userId) {
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
