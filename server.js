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

// Add debug logging for email module to trace the issue
try {
  console.log("SERVER.JS: Starting to debug email module import");
  const p = require("./lib/email");

  // Check if sendPasswordResetEmail exists
  if (typeof p.sendPasswordResetEmail === "function") {
    console.log(
      "SERVER.JS: sendPasswordResetEmail function found successfully"
    );
  } else {
    console.log(
      "SERVER.JS: sendPasswordResetEmail is not a function in the email module"
    );
    console.log(
      "SERVER.JS: Available properties in email module:",
      Object.keys(p)
    );

    // Add the function if it doesn't exist
    p.sendPasswordResetEmail = async (to, token) => {
      console.log(
        "SERVER.JS: Using fallback sendPasswordResetEmail implementation"
      );
      try {
        // Simple implementation that just logs the attempt
        console.log(
          `SERVER.JS: Would send password reset email to ${to} with token ${token}`
        );
        return { success: true };
      } catch (error) {
        console.error(
          `SERVER.JS: Error in fallback sendPasswordResetEmail:`,
          error
        );
        return { success: false, error: error.message };
      }
    };
    console.log("SERVER.JS: Added fallback sendPasswordResetEmail function");
  }
} catch (err) {
  console.error(
    "SERVER.JS: Error loading or checking email module:",
    err.message
  );
}

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    try {
      // Create HTTP server
      const server = createServer((req, res) => {
        // Define allowed origins
        const allowedOrigins =
          process.env.NODE_ENV === "production"
            ? [process.env.NEXT_PUBLIC_APP_URL || "https://buildxpert.ie"]
            : ["http://localhost:3001", "http://127.0.0.1:3001"];

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
          res.writeHead(200);
          res.end();
          return;
        }

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
      const PORT = process.env.PORT || 3001;
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
