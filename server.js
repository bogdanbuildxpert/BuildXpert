// Load environment variables from .env file
require("dotenv").config();

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

// Import Prisma for database operations and real-time notifications
let prismaModule;
try {
  prismaModule = require("./lib/prisma");
  console.log("Prisma module loaded successfully");
} catch (err) {
  console.error("Could not load Prisma module:", err.message);
  process.exit(1); // Exit if Prisma cannot be loaded as it's critical
}

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// Add CORS configuration
app.use((req, res, next) => {
  // Define allowed origins
  const allowedOrigins =
    process.env.NODE_ENV === "production"
      ? [process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com"] // Update with your domain
      : [
          "http://localhost:3000",
          "http://localhost:3001",
          "http://127.0.0.1:3000",
        ];

  const origin = req.headers.origin;

  // Set CORS headers
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  // Important for cross-domain cookies
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-CSRF-Token"
  );

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

app
  .prepare()
  .then(() => {
    try {
      // Create HTTP server
      const server = createServer((req, res) => {
        // Handle Next.js requests
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
      });

      // Initialize Socket.IO with the HTTP server
      try {
        const io = prismaModule.initSocketServer(server);
        console.log("Socket.IO attached to HTTP server");
      } catch (socketError) {
        console.error("Error initializing Socket.IO:", socketError);
        console.warn(
          "Continuing without Socket.IO. Real-time features will not be available."
        );
      }

      // Start the server
      const PORT = process.env.PORT || 3000;
      server.listen(PORT, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${PORT}`);
        console.log(`> Environment: ${dev ? "development" : "production"}`);
      });

      // Handle graceful shutdown
      const handleShutdown = async () => {
        console.log("Shutting down server...");
        try {
          // Disconnect Prisma client
          await prismaModule.prisma.$disconnect();
          console.log("Database connections closed");
        } catch (error) {
          console.error("Error closing database connections:", error);
        }
        process.exit(0);
      };

      process.on("SIGINT", handleShutdown);
      process.on("SIGTERM", handleShutdown);
    } catch (error) {
      console.error("Error starting server:", error);
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error("Error preparing Next.js app:", err);
    process.exit(1);
  });
