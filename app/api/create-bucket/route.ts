import { NextResponse } from "next/server";
import { tryCreateBucket, testStorageAccess } from "@/lib/supabase-direct";

export async function GET() {
  try {
    // First test storage access
    const accessTest = await testStorageAccess();

    if (!accessTest.success) {
      return NextResponse.json(
        {
          success: false,
          stage: "storage_access_test",
          error: accessTest.error,
          message: "Failed to access Supabase storage",
        },
        { status: 500 }
      );
    }

    // Then try to create the bucket
    const result = await tryCreateBucket("app-images");

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? "Bucket created or already exists"
        : "Failed to create bucket",
      error: result.success ? null : result.error,
      data: result.data,
      accessTest,
    });
  } catch (error) {
    console.error("API error:", error);
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
