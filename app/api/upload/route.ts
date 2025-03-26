import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Mark this route as dynamic since it uses cookies and form data
export const dynamic = "force-dynamic";

// Increase body size limit for file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
    responseLimit: "10mb",
  },
};

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
        // Decode the user cookie value in case it was encoded
        const decodedCookie = decodeURIComponent(userCookie);
        const userData = JSON.parse(decodedCookie);
        userId = userData.id;
        console.log("Using user ID from cookie:", userId);
      } catch (err) {
        console.error("Failed to parse user cookie in upload request:", err);
      }
    }

    // If still no user ID, reject as unauthorized
    if (!userId) {
      console.error("No valid authentication found in upload request");
      return NextResponse.json(
        { error: "Unauthorized. Please log in to upload files." },
        { status: 401 }
      );
    }

    console.log("Authenticated user for upload:", userId);

    // Get form data with the file
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const bucket = (formData.get("bucket") as string) || "app-images";
    const path = (formData.get("path") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Log upload details for debugging
    console.log(
      `API: Uploading file to bucket: ${bucket}, path: ${
        path || "root directory"
      }`
    );
    console.log(
      `File details: name=${file.name}, size=${file.size}, type=${file.type}`
    );

    // Create a fresh Supabase client for this request
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

    // IMPORTANT: Always use service role key for admin privileges
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

    // Generate a unique filename
    const timestamp = new Date().toISOString().replace(/[-:.]/g, "");
    const randomId = Math.random().toString(36).substring(2, 10);
    const fileName = `${timestamp}_${randomId}_${file.name.replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    )}`;
    const fullPath = path ? `${path}/${fileName}` : fileName;

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    console.log(`Uploading to path: ${fullPath} with service role key`);

    // Upload to Supabase storage using service role key
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fullPath, fileBuffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Supabase storage upload error:", error);
      return NextResponse.json(
        { error: `Upload failed: ${error.message}` },
        { status: 500 }
      );
    }

    // Get the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path);

    console.log(`Upload successful. Public URL: ${publicUrl}`);
    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("Server error during upload:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
