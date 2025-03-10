const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const {
  initSocketServer,
  initPgNotify,
  setupPgNotifyTriggers,
} = require("./lib/pg-notify");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer((req, res) => {
    // Handle Next.js requests
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.IO with the HTTP server
  const io = initSocketServer(server);
  console.log("Socket.IO attached to HTTP server");

  // Initialize PostgreSQL LISTEN/NOTIFY
  initPgNotify()
    .then((success) => {
      if (success) {
        // Set up PostgreSQL triggers only if the initial connection was successful
        setupPgNotifyTriggers().catch((err) => {
          console.error("Error setting up PostgreSQL triggers:", err);
          console.log(
            "Continuing without database triggers. Some real-time features may not work."
          );
        });
      }
    })
    .catch((err) => {
      console.error("Error initializing PostgreSQL notifications:", err);
      console.log(
        "Continuing without real-time database updates. Some features may not work."
      );
    });

  // Start the server
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
    console.log(`> Socket.IO ready on ws://localhost:${PORT}/socket.io`);
  });

  // Handle graceful shutdown
  const handleShutdown = async () => {
    console.log("Shutting down server...");
    process.exit(0);
  };

  process.on("SIGINT", handleShutdown);
  process.on("SIGTERM", handleShutdown);
});
