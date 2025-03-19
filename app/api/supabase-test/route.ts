import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    // Hard-code credentials for direct testing
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    console.log("Testing Supabase connection with:");
    console.log("URL:", supabaseUrl);
    console.log("Key starts with:", supabaseKey.substring(0, 5) + "...");

    // Create a fresh client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test storage
    console.log("Testing storage...");
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error("Storage error:", bucketsError);
      return NextResponse.json(
        {
          success: false,
          error: bucketsError,
          message: "Could not access storage",
        },
        { status: 500 }
      );
    }

    // Return success with bucket information
    return NextResponse.json({
      success: true,
      message: "Successfully connected to Supabase storage",
      buckets,
      note: "If you see buckets listed, your storage is working",
    });
  } catch (error) {
    console.error("Test failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: JSON.stringify(error),
        message: "Failed to connect to Supabase",
      },
      { status: 500 }
    );
  }
}
