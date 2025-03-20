import { createClient } from "@supabase/supabase-js";

// Base URL and keys from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

// Standard client for general operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "buildxpert-storage-key",
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    fetch: (url, options) => {
      const updatedOptions = {
        ...options,
        headers: {
          ...options?.headers,
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        signal: AbortSignal.timeout(10000),
      };
      return fetch(url, updatedOptions);
    },
  },
});

// Special admin client for operations that need elevated permissions (like storage)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
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

// Helper function to check if Supabase connection is working
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    // Use a faster method to check connection - just list buckets
    const { data, error } = await supabase.storage.listBuckets();

    console.log("Supabase connection check result:", {
      success: !error,
      bucketsFound: data ? data.length : 0,
      buckets: data ? data.map((b) => b.name).join(", ") : "none",
    });

    return !error && data && data.length > 0;
  } catch (error) {
    console.error("Failed to connect to Supabase:", error);
    return false;
  }
}

// Function for uploading images to Supabase storage with service role permissions
export async function uploadImage(
  file: File,
  bucket: string = "app-images",
  path: string = ""
): Promise<{ url: string | null; error: Error | null }> {
  try {
    console.log(
      `Uploading to Supabase storage: bucket=${bucket}, path=${path || "root"}`
    );

    // Use server-side upload API which uses service role key
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucket);
    formData.append("path", path);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `Upload failed with status ${response.status}`
      );
    }

    const data = await response.json();
    return { url: data.url, error: null };
  } catch (error) {
    console.error("Error uploading to Supabase:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      url: null,
      error: new Error(`Failed to upload image: ${errorMessage}`),
    };
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
