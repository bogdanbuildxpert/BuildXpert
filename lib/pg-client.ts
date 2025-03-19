import { Pool, PoolClient, QueryResult } from "pg";

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Error connecting to PostgreSQL:", err);
  } else {
    console.log("PostgreSQL connected:", res.rows[0].now);
  }
});

// Helper function for executing queries
export async function query(
  text: string,
  params?: unknown[]
): Promise<QueryResult> {
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;

    if (process.env.NODE_ENV === "development") {
      console.log("Executed query", { text, duration, rows: res.rowCount });
    }

    return res;
  } catch (error) {
    console.error("Error executing query:", error);
    throw error;
  }
}

// Helper function for transactions
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Clean up on application shutdown
process.on("SIGINT", async () => {
  await pool.end();
  process.exit(0);
});

export default pool;
