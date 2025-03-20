// This script tests the database connection without Prisma
const { Client } = require("pg");
require("dotenv").config();

async function checkDatabaseConnection() {
  console.log("====== DATABASE CONNECTION TEST ======");

  // Extract credentials from DATABASE_URL if available
  let connectionInfo = {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  };

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && (!connectionInfo.host || !connectionInfo.user)) {
    try {
      console.log(`Found DATABASE_URL: ${databaseUrl.substring(0, 20)}...`);

      // Parse the DATABASE_URL to extract connection details
      const match = databaseUrl.match(
        /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/
      );

      if (match) {
        connectionInfo = {
          user: match[1],
          password: match[2],
          host: match[3],
          port: match[4],
          database: match[5],
        };

        console.log(`Extracted connection info from DATABASE_URL:
  Host: ${connectionInfo.host}
  Port: ${connectionInfo.port}
  Database: ${connectionInfo.database}
  User: ${connectionInfo.user}
  Password: [hidden]`);
      } else {
        console.error("Failed to parse DATABASE_URL");
      }
    } catch (error) {
      console.error("Error parsing DATABASE_URL:", error.message);
    }
  } else {
    console.log(
      "Using direct connection parameters from environment variables"
    );
  }

  // Now test the connection
  const client = new Client({
    host: connectionInfo.host,
    port: connectionInfo.port,
    database: connectionInfo.database,
    user: connectionInfo.user,
    password: connectionInfo.password,
    ssl:
      process.env.POSTGRES_SSL === "true"
        ? { rejectUnauthorized: false }
        : undefined,
    connectionTimeoutMillis: 5000, // 5 seconds
  });

  try {
    console.log("Connecting to database...");
    await client.connect();
    console.log("✅ Connected successfully!");

    // Test a simple query
    console.log("Testing query...");
    const result = await client.query('SELECT COUNT(*) FROM "User"');
    console.log(`✅ Query successful! User count: ${result.rows[0].count}`);

    await client.end();
    console.log("✅ Database connection test completed successfully");
    return true;
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
    console.log("\nTroubleshooting tips:");
    console.log("1. Check if the database server is running and accessible");
    console.log("2. Verify that the database credentials are correct");
    console.log(
      "3. Check if any firewalls or security groups are blocking the connection"
    );
    console.log(
      "4. Make sure the database exists and the user has permission to access it"
    );
    console.log(
      "5. If using SSL, ensure SSL connections are enabled on the database server"
    );

    try {
      await client.end();
    } catch (e) {
      // Ignore errors when ending a failed connection
    }

    return false;
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  checkDatabaseConnection()
    .then((success) => {
      if (!success) {
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("Unexpected error:", error);
      process.exit(1);
    });
}

module.exports = { checkDatabaseConnection };
