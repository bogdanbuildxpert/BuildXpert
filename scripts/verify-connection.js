// Database connection verification script with pinning test
require("dotenv").config();
const { Client, Pool } = require("pg");

// Get database connection info from environment variables
const connectionString = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

console.log("==== TESTING DATABASE CONNECTION WITH PINNING ====");
console.log(
  `Connection limit: ${process.env.DATABASE_CONNECTION_LIMIT || "default"}`
);
console.log(`Pool timeout: ${process.env.DATABASE_POOL_TIMEOUT || "default"}`);

// Extract and mask credentials for logging
function maskConnectionString(url) {
  if (!url) return "Not configured";
  try {
    const parts = url.split("@");
    if (parts.length > 1) {
      const credentials = parts[0].split("://")[1];
      const userPart = credentials.split(":")[0];
      return url.replace(credentials, `${userPart}:****`);
    }
    return url;
  } catch (e) {
    return "Error parsing URL";
  }
}

console.log(`DATABASE_URL: ${maskConnectionString(connectionString)}`);
console.log(`DIRECT_URL: ${maskConnectionString(directUrl)}`);

// Test Pool connection (with connection pinning)
async function testPoolConnection() {
  console.log("\nTesting connection pool (pinned connections):");

  const pool = new Pool({
    connectionString,
    max: parseInt(process.env.DATABASE_CONNECTION_LIMIT || "5", 10),
    idleTimeoutMillis:
      parseInt(process.env.DATABASE_POOL_TIMEOUT || "30", 10) * 1000,
    connectionTimeoutMillis: 5000,
    application_name: "buildxpert_test",
  });

  try {
    // Get a client from the pool
    const client = await pool.connect();

    try {
      // Test query
      const result = await client.query(
        "SELECT version() as version, current_setting('application_name') as app_name"
      );
      console.log(`✅ Pool connection successful`);
      console.log(`PostgreSQL version: ${result.rows[0].version}`);
      console.log(`Application name: ${result.rows[0].app_name}`);

      // Check if connection pinning is working
      const sessionResult = await client.query(
        "SELECT pg_backend_pid() as pid"
      );
      const pid1 = sessionResult.rows[0].pid;
      console.log(`Connection PID: ${pid1}`);

      // Run another query with the same client - should use the same backend connection
      const secondResult = await client.query("SELECT pg_backend_pid() as pid");
      const pid2 = secondResult.rows[0].pid;
      console.log(`Second query PID: ${pid2}`);

      if (pid1 === pid2) {
        console.log(
          "✅ Connection pinning SUCCESSFUL - same PID used for multiple queries"
        );
      } else {
        console.log("❌ Connection pinning FAILED - different PIDs used");
      }
    } finally {
      // Release the client back to the pool
      client.release();
    }

    // End pool
    await pool.end();
    console.log("Pool ended successfully");
  } catch (err) {
    console.error("❌ Pool connection error:", err.message);
    try {
      await pool.end();
    } catch (endErr) {
      // Ignore errors during pool ending
    }
  }
}

// Test direct connection (without pgBouncer)
async function testDirectConnection() {
  console.log("\nTesting direct connection (for reference):");

  const client = new Client({
    connectionString: directUrl || connectionString,
    connectionTimeoutMillis: 5000,
    application_name: "buildxpert_direct_test",
  });

  try {
    await client.connect();
    const result = await client.query("SELECT version() as version");
    console.log(`✅ Direct connection successful`);
    console.log(`PostgreSQL version: ${result.rows[0].version}`);
    await client.end();
  } catch (err) {
    console.error("❌ Direct connection error:", err.message);
    try {
      await client.end();
    } catch (endErr) {
      // Ignore errors during client ending
    }
  }
}

// Run tests
async function runTests() {
  await testPoolConnection();
  await testDirectConnection();
  console.log("\n==== CONNECTION TESTS COMPLETED ====");
}

runTests();
