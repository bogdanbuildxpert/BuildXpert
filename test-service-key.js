require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

// Get configuration from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log(`Testing Supabase connection with service key`);
console.log(`URL: ${supabaseUrl}`);
console.log(
  `Service key (abbreviated): ${serviceKey.substring(
    0,
    8
  )}...${serviceKey.substring(serviceKey.length - 8)}`
);

// Create a client with the service role key
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  },
});

// Test storage bucket access using service key
async function testServiceKeyAccess() {
  try {
    console.log("\nAttempting to access Supabase storage with service key...");

    console.log("1. Creating test file...");
    // Create a small test file in memory
    const testData = "This is a test file for Supabase upload";
    const testFileName = "test-service-key.txt";

    // Try to list buckets first
    console.log("2. Listing storage buckets...");
    const { data: buckets, error: bucketError } =
      await supabase.storage.listBuckets();

    if (bucketError) {
      console.error("Error listing buckets:", bucketError);
      return;
    }

    console.log(
      `Found ${buckets.length} buckets:`,
      buckets.map((b) => b.name).join(", ")
    );

    // Use the first bucket for testing
    if (buckets.length === 0) {
      console.log("No buckets found. Creating a test bucket...");

      // Try to create a bucket
      const { data: newBucket, error: createError } =
        await supabase.storage.createBucket("test-uploads", {
          public: true,
        });

      if (createError) {
        console.error("Error creating bucket:", createError);
        return;
      }

      console.log("Created bucket:", newBucket);
      var testBucket = "test-uploads";
    } else {
      var testBucket = buckets[0].name;
    }

    // Try to upload a file
    console.log(`3. Uploading test file to "${testBucket}" bucket...`);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(testBucket)
      .upload(`test-service-key-${Date.now()}.txt`, testData, {
        contentType: "text/plain",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return;
    }

    console.log("File uploaded successfully!");
    console.log("Upload data:", uploadData);

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(testBucket)
      .getPublicUrl(uploadData.path);

    console.log("Public URL:", urlData.publicUrl);
    console.log("\nService key access test PASSED!");
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

// Run the test
testServiceKeyAccess();
