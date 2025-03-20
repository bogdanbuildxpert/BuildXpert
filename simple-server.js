// Load environment variables from .env file
require("dotenv").config();

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

// Development server configuration
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

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
