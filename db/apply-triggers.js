// Script to apply PostgreSQL triggers
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

async function applyTriggers() {
  console.log("Applying PostgreSQL triggers for notifications...");

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  });

  try {
    await client.connect();
    console.log("Connected to database");

    // Read the SQL file
    const sqlPath = path.join(__dirname, "notifications-triggers.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    // Execute the SQL
    await client.query(sql);
    console.log("Successfully applied notification triggers");

    // Test the LISTEN/NOTIFY system
    await client.query("LISTEN test_channel");
    console.log("Listening on test_channel...");

    client.on("notification", (msg) => {
      console.log("Received notification:", msg.channel, msg.payload);
    });

    // Send a test notification
    await client.query(
      `SELECT pg_notify('test_channel', '{"message": "Test notification"}')`
    );
    console.log("Sent test notification");

    // Keep the connection alive for a moment to receive the test notification
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } catch (error) {
    console.error("Error applying triggers:", error);
  } finally {
    await client.end();
    console.log("Database connection closed");
  }
}

// Run the function
applyTriggers().then(() => {
  console.log("Trigger application process completed");
});
