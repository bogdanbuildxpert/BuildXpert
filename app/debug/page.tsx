"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ImageUpload from "@/components/ImageUpload";
import { supabase } from "@/lib/supabase-client";

// Define types for the bucket info response
type BucketInfo = {
  supabaseUrl: string;
  anonKeyFirstChars: string;
  bucketCheck: {
    exists: boolean;
    isPublic: boolean;
    error?: string | Record<string, unknown>;
  };
  availableBuckets?: Array<{
    id: string;
    name: string;
    public: boolean;
  }>;
  files?: Array<{
    name: string;
    metadata?: {
      size: number;
    };
  }>;
};

export default function DebugPage() {
  const [bucketInfo, setBucketInfo] = useState<BucketInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkBucketConfig() {
      try {
        setLoading(true);
        setError(null);

        // Call the API to check bucket configuration
        const response = await fetch("/api/check-bucket");
        const data = await response.json();

        setBucketInfo(data);
      } catch (err) {
        console.error("Error checking bucket:", err);
        setError("Failed to check bucket configuration");
      } finally {
        setLoading(false);
      }
    }

    checkBucketConfig();
  }, []);

  // Function to handle image upload
  const handleImageUploaded = (imageUrl: string) => {
    console.log("Image uploaded successfully:", imageUrl);
    setUploadedImageUrl(imageUrl);
  };

  // Function to force refresh file list
  const refreshFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/check-bucket");
      const data = await response.json();
      setBucketInfo(data);
    } catch (err) {
      console.error("Error refreshing files:", err);
    } finally {
      setLoading(false);
    }
  };

  // Function to test direct upload
  const testDirectUpload = async () => {
    try {
      setLoading(true);

      // Create a small test file
      const blob = new Blob(["test file content"], { type: "text/plain" });
      const file = new File([blob], "test.txt", { type: "text/plain" });

      // Upload directly via Supabase client
      const { data, error } = await supabase.storage
        .from("app-images")
        .upload(`test-${Date.now()}.txt`, file);

      if (error) {
        throw error;
      }

      console.log("Direct upload successful:", data);

      // Refresh the file list
      await refreshFiles();
    } catch (err) {
      console.error("Error in direct upload test:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-16">
      <h1 className="text-3xl font-bold mb-8">Storage Debug Page</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bucket Info */}
        <Card>
          <CardHeader>
            <CardTitle>Supabase Storage Configuration</CardTitle>
            <CardDescription>
              Check if your Supabase storage is configured correctly
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 flex justify-center">Loading...</div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Supabase URL:</h3>
                  <p className="text-sm text-gray-500">
                    {bucketInfo?.supabaseUrl}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium">Anon Key (first chars):</h3>
                  <p className="text-sm text-gray-500">
                    {bucketInfo?.anonKeyFirstChars}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium">Bucket Check:</h3>
                  <div className="space-y-1 mt-1">
                    <p>
                      <span className="font-medium">Exists:</span>{" "}
                      <span
                        className={
                          bucketInfo?.bucketCheck?.exists
                            ? "text-green-500"
                            : "text-red-500"
                        }
                      >
                        {bucketInfo?.bucketCheck?.exists ? "Yes" : "No"}
                      </span>
                    </p>
                    <p>
                      <span className="font-medium">Public Access:</span>{" "}
                      <span
                        className={
                          bucketInfo?.bucketCheck?.isPublic
                            ? "text-green-500"
                            : "text-red-500"
                        }
                      >
                        {bucketInfo?.bucketCheck?.isPublic ? "Yes" : "No"}
                      </span>
                    </p>
                    {bucketInfo?.bucketCheck?.error && (
                      <p className="text-red-500">
                        Error:{" "}
                        {typeof bucketInfo.bucketCheck.error === "object"
                          ? JSON.stringify(bucketInfo.bucketCheck.error)
                          : String(bucketInfo.bucketCheck.error)}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium">Available Buckets:</h3>
                  {bucketInfo?.availableBuckets?.length ? (
                    <ul className="list-disc pl-5 mt-1">
                      {bucketInfo.availableBuckets.map((bucket) => (
                        <li key={bucket.id} className="text-sm">
                          {bucket.name}{" "}
                          {bucket.public ? "(public)" : "(private)"}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-red-500">No buckets found</p>
                  )}
                </div>

                <div>
                  <h3 className="font-medium">Files in app-images:</h3>
                  {bucketInfo?.files?.length ? (
                    <ul className="list-disc pl-5 mt-1">
                      {bucketInfo.files.map((file, index) => (
                        <li key={index} className="text-sm">
                          {file.name} (
                          {((file.metadata?.size || 0) / 1024).toFixed(2)} KB)
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No files found</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <div className="flex gap-4 flex-wrap">
              <Button onClick={refreshFiles} disabled={loading}>
                Refresh
              </Button>
              <Button
                onClick={testDirectUpload}
                disabled={loading}
                variant="outline"
              >
                Test Direct Upload
              </Button>
              <Button
                onClick={async () => {
                  try {
                    setLoading(true);
                    const res = await fetch("/api/supabase-test");
                    const data = await res.json();
                    console.log("Supabase test result:", data);
                    alert(
                      data.success
                        ? `Success! Found ${data.buckets?.length || 0} buckets.`
                        : `Failed: ${data.message}`
                    );
                  } catch (err) {
                    console.error(err);
                    alert("Test failed. See console for details.");
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                variant="secondary"
              >
                Test Connection
              </Button>
              <Button
                onClick={async () => {
                  try {
                    setLoading(true);
                    const res = await fetch("/api/create-bucket");
                    const data = await res.json();
                    console.log("Create bucket result:", data);
                    alert(
                      data.success
                        ? "Bucket created or already exists!"
                        : `Failed: ${data.message}`
                    );
                    // Refresh after attempt
                    refreshFiles();
                  } catch (err) {
                    console.error(err);
                    alert("Create bucket failed. See console for details.");
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                variant="destructive"
              >
                Create Bucket
              </Button>
              <Button
                onClick={async () => {
                  if (
                    !confirm(
                      "This will use admin privileges to create the bucket. Continue?"
                    )
                  ) {
                    return;
                  }
                  try {
                    setLoading(true);
                    const res = await fetch("/api/admin-create-bucket");
                    const data = await res.json();
                    console.log("Admin create bucket result:", data);
                    alert(
                      data.success
                        ? "Bucket created with admin privileges!"
                        : `Failed: ${data.message}`
                    );
                    // Refresh after attempt
                    refreshFiles();
                  } catch (err) {
                    console.error(err);
                    alert(
                      "Admin create bucket failed. See console for details."
                    );
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                variant="outline"
                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300"
              >
                Admin Create Bucket
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Image Upload Test */}
        <Card>
          <CardHeader>
            <CardTitle>Test Image Upload</CardTitle>
            <CardDescription>
              Test uploading an image to the app-images bucket
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUpload
              onImageUpload={handleImageUploaded}
              maxImages={1}
              bucket="app-images"
              path="debug-test"
            />

            {uploadedImageUrl && (
              <div className="mt-6">
                <h3 className="font-medium mb-2">Uploaded Image:</h3>
                <div className="border rounded-md overflow-hidden">
                  <img
                    src={uploadedImageUrl}
                    alt="Uploaded test"
                    className="w-full object-contain max-h-64"
                  />
                </div>
                <p className="text-xs mt-2 break-all">{uploadedImageUrl}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
