import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Mark as dynamic since we're using cookies
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Get session from NextAuth
    const session = await getServerSession(authOptions);

    // Try to get user data from cookies as a fallback
    const userCookie = cookies().get("user")?.value;

    // Check if we have proper authentication from either source
    let userId = session?.user?.id;

    // If no NextAuth session, try to get from cookie
    if (!userId && userCookie) {
      try {
        const decodedCookie = decodeURIComponent(userCookie);
        const userData = JSON.parse(decodedCookie);
        userId = userData.id;
        console.log("Using user ID from cookie for image deletion:", userId);
      } catch (err) {
        console.error("Failed to parse user cookie in delete request:", err);
      }
    }

    // If still no user ID, reject as unauthorized
    if (!userId) {
      console.error("No valid authentication found in delete image request");
      return NextResponse.json(
        { error: "Unauthorized. Please log in to delete files." },
        { status: 401 }
      );
    }

    // Parse request body for the image URL
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "No image URL provided" },
        { status: 400 }
      );
    }

    // Extract path from URL
    // The URL format is typically: https://[supabase-project].supabase.co/storage/v1/object/public/[bucket]/[path]
    // We need to extract the bucket and path parts
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const storageUrlPrefix = `${supabaseUrl}/storage/v1/object/public/`;

    if (!imageUrl.startsWith(storageUrlPrefix)) {
      return NextResponse.json(
        { error: "Invalid Supabase image URL format" },
        { status: 400 }
      );
    }

    // Extract bucket and path
    const pathParts = imageUrl.substring(storageUrlPrefix.length).split("/");
    const bucket = pathParts[0];
    const filePath = pathParts.slice(1).join("/");

    console.log(
      `API: Deleting image from bucket: ${bucket}, path: ${filePath}`
    );

    // Create a fresh Supabase client with service role key
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      return NextResponse.json(
        { error: "Server configuration error: Missing Supabase service key" },
        { status: 500 }
      );
    }

    // Initialize with explicit authentication headers using service key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
      },
    });

    // Delete the file from Supabase storage
    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      console.error("Supabase storage delete error:", error);
      return NextResponse.json(
        { error: `Delete failed: ${error.message}` },
        { status: 500 }
      );
    }

    console.log(`Successfully deleted image: ${imageUrl}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Server error during image deletion:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
