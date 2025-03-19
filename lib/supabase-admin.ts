import { createClient } from "@supabase/supabase-js";

// NOTE: Only use this client for admin operations like bucket creation
// that need elevated permissions. NEVER expose this in client-side code.

// This URL should match your project
const SUPABASE_URL = "https://tmuzciprtqwpypvzwtye.supabase.co";

// You'll need to replace this with your service role key from Supabase dashboard
// Settings > API > service_role key
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Create a Supabase client with admin privileges
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Admin function to create a bucket (only use server-side)
export async function createBucketAdmin(name: string = "app-images") {
  try {
    console.log(`Trying to create bucket with admin privileges: ${name}`);
    const { data, error } = await supabaseAdmin.storage.createBucket(name, {
      public: true,
    });

    if (error) {
      console.error("Admin bucket creation error:", error);
      return { success: false, error };
    }

    console.log("Bucket created with admin privileges:", data);

    // Set public bucket policy
    try {
      // Make bucket public by default
      const { error: policyError } = await supabaseAdmin.storage
        .from(name)
        .createSignedUrl("dummy.txt", 1); // This just tests permissions

      if (policyError && !policyError.message.includes("not found")) {
        console.warn("Warning: Could not verify bucket access:", policyError);
      }
    } catch (policyErr) {
      console.warn("Warning setting policy:", policyErr);
    }

    return { success: true, data };
  } catch (error) {
    console.error("Admin bucket creation failed:", error);
    return { success: false, error };
  }
}
