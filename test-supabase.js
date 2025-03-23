require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

// Get the values from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Testing Supabase connection with:");
console.log(`URL: ${supabaseUrl}`);
console.log(
  `Key: ${supabaseKey.substring(0, 10)}...${supabaseKey.substring(
    supabaseKey.length - 10
  )}`
);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  global: {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  },
});

// Test connection by listing buckets
async function testConnection() {
  try {
    console.log("\nAttempting to connect to Supabase...");

    // Test basic connection with health check
    const { data: healthData, error: healthError } = await supabase
      .from("health")
      .select("*")
      .limit(1);

    if (healthError) {
      console.log("Health check error:", healthError);
    } else {
      console.log("Database health check successful!");
    }

    // Try to list storage buckets
    console.log("\nAttempting to list storage buckets...");
    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error("Error listing buckets:", error);
      return;
    }

    console.log("Successfully connected to Supabase storage!");
    console.log("Available buckets:", data.map((b) => b.name).join(", "));

    // Try to list files in each bucket
    for (const bucket of data) {
      console.log(`\nListing files in bucket: ${bucket.name}`);
      try {
        const { data: files, error: listError } = await supabase.storage
          .from(bucket.name)
          .list();

        if (listError) {
          console.error(`Error listing files in ${bucket.name}:`, listError);
          continue;
        }

        console.log(
          `Files in ${bucket.name}:`,
          files.length > 0 ? files.map((f) => f.name).join(", ") : "No files"
        );
      } catch (e) {
        console.error(`Exception listing files in ${bucket.name}:`, e);
      }
    }
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

testConnection();
