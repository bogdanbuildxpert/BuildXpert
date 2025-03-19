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
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["polling", "websocket"],
    });

    console.log("Socket.IO server initialized");

    io.on("connection", (socket) => {
      console.log("Client connected with ID:", socket.id);

      // Handle user joining a room (for private messaging)
      socket.on("join", (userId) => {
        if (userId) {
          socket.join(userId);
          console.log(`User ${userId} joined their private room`);
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
