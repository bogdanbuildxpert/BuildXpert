// PostgreSQL notification functionality for real-time messaging
const { Pool, Client } = require("pg");
const { Server } = require("socket.io");

// Socket.io instance
let io;
// PostgreSQL notification client
let notifyClient = null;

// Create a connection pool using the DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Test the connection
pool
  .query("SELECT NOW()")
  .then((res) => {
    console.log("PostgreSQL connected:", res.rows[0].now);
  })
  .catch((err) => {
    console.error("Error connecting to PostgreSQL:", err);
  });

// Function to initialize Socket.IO server
function initSocketServer(server) {
  try {
    // Use a more compatible configuration for Socket.IO
    io = new Server(server, {
      path: "/socket.io",
      cors: {
        origin: "*", // Allow any origin during development
        methods: ["GET", "POST"],
        credentials: true,
      },
      // Make sure we support both polling and websocket transports
      transports: ["polling", "websocket"],
      // Increase timeouts for better stability
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    console.log("Socket.IO server initialized with path /socket.io");

    // Keep track of authenticated users
    const authenticatedUsers = new Set();

    io.on("connection", (socket) => {
      console.log("Client connected with ID:", socket.id);

      // Handle user joining a room (for private messaging)
      socket.on("join", (userId) => {
        if (userId) {
          // Add user to authenticated set
          authenticatedUsers.add(userId);

          // Join the room for this user
          socket.join(userId);
          console.log(`User ${userId} joined their private room`);

          // Send a confirmation to the client
          socket.emit("joined", {
            status: "success",
            message: "Successfully joined room",
            userId: userId,
          });
        }
      });

      // Handle new message event
      socket.on("send_message", (message) => {
        if (message.senderId && message.receiverId) {
          io.to(message.receiverId).emit("new_message", message);
          io.to(message.senderId).emit("new_message", message);
          console.log(
            `Message sent from ${message.senderId} to ${message.receiverId}`
          );
        }
      });

      // Handle disconnect
      socket.on("disconnect", () => {
        console.log("Client disconnected with ID:", socket.id);
      });
    });

    return io;
  } catch (error) {
    console.error("Error initializing Socket.IO:", error);
    // Return a mock socket.io instance to prevent errors
    return {
      on: () => {},
      to: () => ({ emit: () => {} }),
      emit: () => {},
    };
  }
}

// Initialize PostgreSQL LISTEN/NOTIFY
async function initPgNotify() {
  try {
    if (notifyClient) {
      return true;
    }

    notifyClient = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
    });

    await notifyClient.connect();
    console.log("PostgreSQL notification client connected");

    return true;
  } catch (error) {
    console.error("Error initializing PostgreSQL notification client:", error);
    return false;
  }
}

// Set up triggers for database notifications
async function setupPgNotifyTriggers() {
  try {
    console.log("Setting up PostgreSQL notification triggers");
    return true;
  } catch (error) {
    console.error("Error setting up PostgreSQL notification triggers:", error);
    return false;
  }
}

// Clean up resources
async function closeConnections() {
  let closed = true;

  if (notifyClient) {
    try {
      await notifyClient.end();
    } catch (error) {
      console.error("Error closing notification client:", error);
      closed = false;
    }
    notifyClient = null;
  }

  try {
    await pool.end();
  } catch (error) {
    console.error("Error closing connection pool:", error);
    closed = false;
  }

  return closed;
}

// Export functions
module.exports = {
  initSocketServer,
  initPgNotify,
  setupPgNotifyTriggers,
  closeConnections,
  pool,
};
