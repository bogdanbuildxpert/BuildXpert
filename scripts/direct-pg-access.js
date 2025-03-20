const { Client } = require("pg");
require("dotenv").config();

async function main() {
  console.log("Connecting directly to PostgreSQL without Prisma...");

  // Parse connection info from DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  console.log(`Database URL: ${databaseUrl.substring(0, 20)}...`);

  // Extract connection details from DATABASE_URL
  const match = databaseUrl.match(
    /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/
  );

  if (!match) {
    console.error("Failed to parse DATABASE_URL");
    process.exit(1);
  }

  const connectionInfo = {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    database: match[5],
  };

  console.log(`Connection info:
  Host: ${connectionInfo.host}
  Port: ${connectionInfo.port}
  Database: ${connectionInfo.database}
  User: ${connectionInfo.user}
  Password: [hidden]`);

  const client = new Client({
    host: connectionInfo.host,
    port: connectionInfo.port,
    database: connectionInfo.database,
    user: connectionInfo.user,
    password: connectionInfo.password,
  });

  try {
    // Connect to the database
    console.log("Connecting...");
    await client.connect();
    console.log("✅ Connected successfully!");

    // Run example queries
    // 1. Count users
    const userCountResult = await client.query('SELECT COUNT(*) FROM "User"');
    console.log(`✅ User count: ${userCountResult.rows[0].count}`);

    // 2. List all users with selected fields
    const usersResult = await client.query(`
      SELECT id, name, email, role, "createdAt" 
      FROM "User" 
      LIMIT 10`);

    console.log("\nUsers in database:");
    console.table(usersResult.rows);

    // 3. Count projects
    const projectCountResult = await client.query(
      'SELECT COUNT(*) FROM "Project"'
    );
    console.log(`\nProject count: ${projectCountResult.rows[0].count}`);

    // You can add more custom SQL queries here
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
  } finally {
    await client.end();
    console.log("Database connection closed");
  }
}

main()
  .then(() => console.log("Done"))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
