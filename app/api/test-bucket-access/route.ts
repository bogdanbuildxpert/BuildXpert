import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Type for bucket file results
interface BucketResult {
  error?: string;
  count?: number;
  files?: string[];
}

// Test endpoint for Supabase storage access (service role)
export async function GET() {
  try {
    // Create a Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          headers: {
            // Use the service role key for both auth header and apikey
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
            Authorization: `Bearer ${
              process.env.SUPABASE_SERVICE_ROLE_KEY || ""
            }`,
          },
        },
      }
    );

    console.log("Testing Supabase bucket access with service role key...");

    // List all buckets using service role for maximum permissions
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to list buckets: ${bucketsError.message}`,
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        },
        { status: 500 }
      );
    }

    // Check if we have the expected buckets
    const expectedBuckets = ["app-images", "job-images"];
    const foundBuckets = buckets.map((b) => b.name);
    const allBucketsFound = expectedBuckets.every((b) =>
      foundBuckets.includes(b)
    );

    // Try to list files in both buckets
    const results: Record<string, BucketResult> = {};

    for (const bucket of foundBuckets) {
      const { data: files, error: filesError } = await supabase.storage
        .from(bucket)
        .list();

      if (filesError) {
        results[bucket] = { error: filesError.message };
      } else {
        results[bucket] = {
          count: files.length,
          files: files.map((f) => f.name).slice(0, 5), // Limit to first 5 files
        };
      }
    }

    return NextResponse.json({
      success: true,
      buckets: foundBuckets,
      allExpectedBucketsFound: allBucketsFound,
      expectedBuckets,
      bucketDetails: results,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    });
  } catch (error) {
    console.error("Error testing bucket access:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      },
      { status: 500 }
    );
  }
}
