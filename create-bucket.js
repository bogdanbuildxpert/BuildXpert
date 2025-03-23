const { createClient } = require("@supabase/supabase-js");

// Create a Supabase client
const supabase = createClient(
  "https://tmuzclprtqwpypvzwtye.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtdXpjbHBydHF3cHlwdnp3dHllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyMTg4ODEsImV4cCI6MjA1Nzc5NDg4MX0.3nwQh7G7Iu4T9nx5LGhINwtgVOVR5bYc7duq6MDwSsA"
);

async function createBucket() {
  console.log("Creating app-images bucket in Supabase...");

  try {
    // First check if the bucket already exists
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) {
      console.error("Error listing buckets:", listError);
      return;
    }

    console.log("Current buckets:", buckets);

    // Check if our bucket already exists
    const bucketExists = buckets.some((bucket) => bucket.name === "app-images");

    if (bucketExists) {
      console.log("Bucket app-images already exists");
    } else {
      // Create the bucket
      console.log("Creating new bucket: app-images");
      const { data, error } = await supabase.storage.createBucket(
        "app-images",
        {
          public: true, // Make the bucket public
          fileSizeLimit: 5242880, // 5MB file size limit
        }
      );

      if (error) {
        console.error("Error creating bucket:", error);
      } else {
        console.log("Successfully created bucket:", data);
      }
    }

    // Set up bucket policies to allow public access to files
    console.log("Setting public access policy for app-images bucket");
    const { error: policyError } = await supabase.storage
      .from("app-images")
      .createSignedUrl("dummy", 60);

    if (policyError && policyError.message !== "The resource was not found") {
      console.error("Error setting bucket policy:", policyError);
    } else {
      console.log("Bucket policy set successfully or bucket does not exist");
    }
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

// Run the function
createBucket().finally(() => {
  console.log("Bucket creation process completed");
});

// Keep the process alive for a bit to ensure all async operations complete
setTimeout(() => {
  console.log("Exiting after timeout");
  process.exit(0);
}, 15000); // 15 second timeout
