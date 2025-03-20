import { NextRequest, NextResponse } from "next/server";

// Debug endpoint to log the exact content of the request body
export async function POST(request: NextRequest) {
  try {
    // Get the raw request body
    const body = await request.json();

    // Log the entire body content
    console.log("DEBUG - Raw request body:", JSON.stringify(body, null, 2));

    // Return the received body for verification
    return NextResponse.json({
      received: body,
      message: "Request body logged successfully",
    });
  } catch (error) {
    console.error("Error in debug endpoint:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
