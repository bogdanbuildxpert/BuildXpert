import { NextResponse } from "next/server";
import { checkBucket, supabase } from "@/lib/supabase-client";

export async function GET() {
  try {
    // Check if the bucket exists and is properly configured
    const bucketCheck = await checkBucket("app-images");

    // Get a list of available buckets
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    // Try to list files in the app-images bucket
    let files: unknown[] = [];
    let listError = null;

    if (bucketCheck.exists) {
      const { data, error } = await supabase.storage.from("app-images").list();
      files = data || [];
      listError = error;
    }

    // Return all the information
    return NextResponse.json({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKeyFirstChars:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10) + "...",
      bucketCheck,
      availableBuckets: buckets,
      bucketsError,
      files,
      listError,
    });
  } catch (error) {
    console.error("Error checking bucket:", error);
    return NextResponse.json(
      { error: "Failed to check bucket configuration" },
      { status: 500 }
    );
  }
}
