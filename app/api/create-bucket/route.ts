import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create a bucket in Supabase storage (requires service role key)
export async function GET() {
  try {
    // Initialize Supabase with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          headers: {
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
            Authorization: `Bearer ${
              process.env.SUPABASE_SERVICE_ROLE_KEY || ""
            }`,
          },
        },
      }
    );

    // Names of buckets to create
    const bucketNames = ["app-images", "job-images"];
    const results = [];

    // Try to create each bucket
    for (const bucketName of bucketNames) {
      console.log(`Attempting to create bucket: ${bucketName}`);

      // Check if bucket already exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const existingBucket = buckets?.find((b) => b.name === bucketName);

      if (existingBucket) {
        console.log(`Bucket ${bucketName} already exists`);
        results.push({
          name: bucketName,
          status: "already_exists",
        });
        continue;
      }

      // Create the bucket
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: true,
      });

      if (error) {
        console.error(`Error creating bucket ${bucketName}:`, error);
        results.push({
          name: bucketName,
          status: "error",
          error: error.message,
        });
      } else {
        console.log(`Created bucket ${bucketName}:`, data);
        results.push({
          name: bucketName,
          status: "created",
        });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Error in create-bucket API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
