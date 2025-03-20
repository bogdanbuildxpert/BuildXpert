import { createClient } from "@supabase/supabase-js";

// Direct Supabase connection for server-side
const SUPABASE_URL = "https://tmuzclprtqwpypvzwtye.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Create client with explicit options
export const supabaseDirect = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false, // Don't persist the session to avoid auth issues
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// Test function to check if storage is accessible
export async function testStorageAccess() {
  try {
    console.log("Testing direct storage access...");
    const { data, error } = await supabaseDirect.storage.listBuckets();

    if (error) {
      console.error("Storage access error:", error);
      return { success: false, error };
    }

    console.log("Storage buckets:", data);
    return { success: true, buckets: data };
  } catch (error) {
    console.error("Storage test failed:", error);
    return { success: false, error };
  }
}

// Utility to try creating a bucket
export async function tryCreateBucket(name: string = "app-images") {
  try {
    console.log(`Trying to create bucket: ${name}`);
    const { data, error } = await supabaseDirect.storage.createBucket(name, {
      public: true,
    });

    if (error) {
      console.error("Bucket creation error:", error);
      return { success: false, error };
    }

    console.log("Bucket created:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Bucket creation failed:", error);
    return { success: false, error };
  }
}
