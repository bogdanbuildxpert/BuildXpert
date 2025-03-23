require("dotenv").config();
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

// Get the values from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Testing direct upload with:");
console.log(`URL: ${supabaseUrl}`);
console.log(
  `Key: ${supabaseKey.substring(0, 10)}...${supabaseKey.substring(
    supabaseKey.length - 10
  )}`
);

// Create a test file
const testFileName = "test-file.txt";
fs.writeFileSync(testFileName, "This is a test file for Supabase upload.");
console.log(`Created test file: ${testFileName}`);

// Create Supabase client with detailed logging
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
    fetch: (url, options) => {
      console.log(`Fetch request to: ${url}`);
      console.log("Request headers:", options?.headers);

      // Add a timeout of 10 seconds
      const updatedOptions = {
        ...options,
        headers: {
          ...options?.headers,
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      };

      return fetch(url, updatedOptions)
        .then((response) => {
          console.log(`Response status: ${response.status}`);
          return response;
        })
        .catch((error) => {
          console.error("Fetch error:", error);
          throw error;
        });
    },
  },
});

// Try to upload a file to the bucket
async function testDirectUpload() {
  try {
    console.log("\nAttempting to upload a test file to Supabase...");

    // First confirm if buckets exist
    console.log("Listing buckets...");
    const { data: buckets, error: bucketError } =
      await supabase.storage.listBuckets();

    if (bucketError) {
      console.error("Error listing buckets:", bucketError);
      return;
    }

    console.log(
      "Available buckets:",
      buckets.map((b) => b.name).join(", ") || "None"
    );

    // Try each bucket if available, otherwise try to create one
    const targetBucket = buckets.length > 0 ? buckets[0].name : "test-bucket";

    // If no buckets found, create one
    if (buckets.length === 0) {
      console.log(`No buckets found. Creating bucket: ${targetBucket}`);
      const { data: newBucket, error: createError } =
        await supabase.storage.createBucket(targetBucket, {
          public: true,
        });

      if (createError) {
        console.error("Error creating bucket:", createError);
        return;
      }

      console.log("Bucket created successfully:", newBucket);
    }

    // Read the test file
    const fileContent = fs.readFileSync(testFileName);
    console.log(
      `Reading file: ${testFileName}, size: ${fileContent.length} bytes`
    );

    // Upload the file
    console.log(`Uploading to bucket: ${targetBucket}...`);
    const uniqueFileName = `test-${Date.now()}.txt`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(targetBucket)
      .upload(uniqueFileName, fileContent, {
        contentType: "text/plain",
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      return;
    }

    console.log("Upload successful:", uploadData);

    // Get the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(targetBucket).getPublicUrl(uniqueFileName);

    console.log("Public URL:", publicUrl);
    console.log("Test completed successfully!");
  } catch (error) {
    console.error("Unexpected error during upload test:", error);
  } finally {
    // Clean up the test file
    fs.unlinkSync(testFileName);
    console.log(`Removed test file: ${testFileName}`);
  }
}

testDirectUpload();
