import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    // Create client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test basic bucket operations
    console.log("Testing app-images bucket operations...");

    // 1. List all files in bucket
    console.log("Listing files in bucket...");
    const { data: listData, error: listError } = await supabase.storage
      .from("app-images")
      .list();

    if (listError) {
      console.error("Error listing bucket contents:", listError);
      return NextResponse.json(
        {
          success: false,
          error: listError,
          operation: "list",
          message: "Failed to list bucket contents",
        },
        { status: 500 }
      );
    }

    // 2. Try to upload a simple test file
    console.log("Creating test file...");
    const testFile = new Blob(["test content"], { type: "text/plain" });
    const testFileName = `test-${Date.now()}.txt`;

    console.log(`Uploading ${testFileName} to app-images...`);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("app-images")
      .upload(testFileName, testFile);

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      return NextResponse.json(
        {
          success: false,
          error: uploadError,
          operation: "upload",
          message: "Failed to upload test file",
          listData, // Return list results even if upload failed
        },
        { status: 500 }
      );
    }

    // 3. Get a public URL for the file
    const {
      data: { publicUrl },
    } = supabase.storage.from("app-images").getPublicUrl(testFileName);

    return NextResponse.json({
      success: true,
      message: "Successfully tested bucket operations",
      listResults: listData,
      uploadResult: uploadData,
      publicUrl,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: JSON.stringify(error),
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
