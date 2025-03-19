import { NextResponse } from "next/server";
import { createBucketAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    // Create the bucket with admin privileges
    const result = await createBucketAdmin("app-images");

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: "Failed to create bucket with admin privileges",
          tip: "Check that you've set the SUPABASE_SERVICE_ROLE_KEY in your .env file",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Bucket created successfully with admin privileges",
      data: result.data,
    });
  } catch (error) {
    console.error("Admin API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: JSON.stringify(error),
        message: "Failed to create bucket due to an unexpected error",
      },
      { status: 500 }
    );
  }
}
