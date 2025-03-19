import { createClient } from "@supabase/supabase-js";

// These variables will be loaded from .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to upload an image to Supabase Storage
export async function uploadImage(
  file: File,
  bucket: string = "app-images",
  path: string = ""
): Promise<{ url: string | null; error: Error | null }> {
  try {
    if (!file) {
      throw new Error("No file provided");
    }

    // Generate a unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()
      .toString(36)
      .substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    // Upload file to Supabase
    console.log(
      `Attempting to upload to Supabase bucket: ${bucket}, path: ${filePath}`
    );
    console.log(
      `File type: ${file.type}, size: ${(file.size / 1024).toFixed(2)}KB`
    );

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      console.error("Upload details:", {
        bucket,
        filePath,
        fileType: file.type,
        fileSize: file.size,
      });
      throw error;
    }

    console.log("Upload successful, data:", data);

    // Construct the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error("Error uploading image:", error);
    return { url: null, error: error as Error };
  }
}

// Helper function to delete an image from Supabase Storage
export async function deleteImage(
  path: string,
  bucket: string = "app-images"
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error("Error deleting image:", error);
    return { success: false, error: error as Error };
  }
}

// Function to check if bucket exists and is properly configured
export async function checkBucket(bucketName: string = "app-images"): Promise<{
  exists: boolean;
  isPublic: boolean;
  error: unknown | null;
}> {
  try {
    console.log(`Checking bucket: ${bucketName}`);

    // First check if bucket exists
    const { data: buckets, error: getBucketsError } =
      await supabase.storage.listBuckets();

    if (getBucketsError) {
      console.error("Error checking buckets:", getBucketsError);
      return { exists: false, isPublic: false, error: getBucketsError };
    }

    console.log(
      "Available buckets:",
      buckets.map((b) => b.name)
    );

    const bucketExists = buckets.some((bucket) => bucket.name === bucketName);

    if (!bucketExists) {
      console.error(`Bucket "${bucketName}" does not exist!`);
      return {
        exists: false,
        isPublic: false,
        error: `Bucket "${bucketName}" not found`,
      };
    }

    // Check if we can list files in the bucket (to verify permissions)
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list();

    if (listError) {
      console.error(
        `Error listing files in bucket "${bucketName}":`,
        listError
      );
      return { exists: true, isPublic: false, error: listError };
    }

    console.log(`Successfully accessed bucket "${bucketName}". Files:`, files);
    return { exists: true, isPublic: true, error: null };
  } catch (error) {
    console.error("Error checking bucket:", error);
    return { exists: false, isPublic: false, error };
  }
}
