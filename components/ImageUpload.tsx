import { useState, useCallback, useEffect, useRef } from "react";
import { ImageIcon, X, AlertCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import {
  compressImage,
  createImagePreview,
  revokeImagePreview,
} from "@/lib/image-compression";
import { uploadImage } from "@/lib/supabase-client";
import { toast } from "sonner";

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void;
  onRemoveImage: (imageUrl: string) => void;
  existingImages: string[];
  maxImages?: number;
  bucket?: string;
  path?: string;
  className?: string;
}

export default function ImageUpload({
  onImageUpload,
  onRemoveImage,
  existingImages,
  maxImages = 10,
  bucket = "app-images",
  path = "",
  className = "",
}: ImageUploadProps) {
  // Track upload status but not the images themselves
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{
    [key: string]: boolean;
  }>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingImages, setDeletingImages] = useState<{
    [key: string]: boolean;
  }>({});

  const uploadToSupabase = useCallback(
    async (file: File) => {
      const fileId = `${file.name}-${Date.now()}`;
      try {
        // Clear any previous errors
        setUploadError(null);

        // Update uploading status for this file
        setUploadingFiles((prev) => ({
          ...prev,
          [fileId]: true,
        }));

        // Determine which bucket to use based on the path or URL
        // If the path contains 'job', use job-images bucket
        const actualBucket =
          path.includes("job") || window.location.pathname.includes("job")
            ? "job-images"
            : bucket;

        // Add detailed debug logs
        console.log(
          `Uploading to bucket: ${actualBucket}, path: ${path || "root"}`
        );
        console.log(
          `File: ${file.name}, size: ${(file.size / 1024).toFixed(
            2
          )}KB, type: ${file.type}`
        );

        // Use server-side upload endpoint instead of direct Supabase upload
        // to avoid token authentication issues
        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucket", actualBucket);
        formData.append("path", path);

        // Call our optimized API endpoint
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
        const url = data.url;

        if (url) {
          console.log(`Upload successful. Image URL: ${url}`);

          // Call the callback with uploaded URL
          onImageUpload(url);
          return url;
        }

        throw new Error("No URL returned from upload");
      } catch (error) {
        console.error("Error uploading image:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";

        toast.error(`Failed to upload ${file.name}: ${errorMessage}`);
        setUploadError(errorMessage);
        return null;
      } finally {
        // Clear upload status for this file
        setUploadingFiles((prev) => {
          const updated = { ...prev };
          delete updated[fileId];
          return updated;
        });
      }
    },
    [bucket, path, onImageUpload]
  );

  const handleImageChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;

      setIsUploading(true);
      setUploadError(null);

      try {
        const files = Array.from(e.target.files);
        console.log(`Processing ${files.length} file(s) for upload`);

        // Check if adding these files would exceed the maximum
        if (existingImages.length + files.length > maxImages) {
          toast.error(`You can only upload a maximum of ${maxImages} images`);
          setIsUploading(false);
          return;
        }

        // Process each selected file
        const uploadPromises = files.map(async (file) => {
          try {
            console.log(
              `Processing file: ${file.name}, type: ${file.type}, size: ${(
                file.size / 1024
              ).toFixed(2)}KB`
            );

            // Validate file size before compression
            if (file.size > 5 * 1024 * 1024) {
              toast.error(`${file.name} is too large. Maximum size is 5MB.`);
              return null;
            }

            // Compress the image
            const compressedFile = await compressImage(file);
            console.log(
              `Compressed size: ${(compressedFile.size / 1024).toFixed(2)}KB`
            );

            // Upload directly
            return await uploadToSupabase(compressedFile);
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
            const errorMsg =
              error instanceof Error ? error.message : "Unknown error";
            toast.error(`Failed to process ${file.name}: ${errorMsg}`);
            return null;
          }
        });

        await Promise.all(uploadPromises);
        console.log("All uploads completed");

        // Reset the input value so the same file can be selected again
        e.target.value = "";
      } catch (error) {
        console.error("Error processing images:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to process images";
        setUploadError(errorMessage);
        toast.error(`Failed to process images: ${errorMessage}`);
      } finally {
        setIsUploading(false);
      }
    },
    [existingImages, maxImages, uploadToSupabase]
  );

  // Function to delete image from Supabase storage
  const deleteImageFromStorage = useCallback(
    async (imageUrl: string) => {
      // Set the deleting state for this image
      setDeletingImages((prev) => ({
        ...prev,
        [imageUrl]: true,
      }));

      try {
        // Call the API to delete the image from storage
        const response = await fetch("/api/delete-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageUrl }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `Delete failed with status ${response.status}`
          );
        }

        // If successful, remove from component state through callback
        onRemoveImage(imageUrl);
        console.log(`Successfully deleted image from storage: ${imageUrl}`);
      } catch (error) {
        console.error("Error deleting image from storage:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Delete failed";

        // Still remove from UI but show error
        onRemoveImage(imageUrl);
        toast.error(
          `Image removed from form but may not be deleted from storage: ${errorMessage}`
        );
      } finally {
        // Clear deleting state for this image
        setDeletingImages((prev) => {
          const updated = { ...prev };
          delete updated[imageUrl];
          return updated;
        });
      }
    },
    [onRemoveImage]
  );

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-3 gap-2">
        {/* Display existing images */}
        {existingImages.map((imageUrl, index) => (
          <div
            key={`${imageUrl}-${index}`}
            className="relative rounded-md overflow-hidden border aspect-square"
          >
            <img
              src={imageUrl}
              alt={`Uploaded image ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => deleteImageFromStorage(imageUrl)}
              className="absolute top-1 right-1 bg-black/70 hover:bg-black p-1 rounded-full"
              aria-label="Remove image"
              disabled={deletingImages[imageUrl]}
            >
              {deletingImages[imageUrl] ? (
                <Loader2 className="h-4 w-4 text-white animate-spin" />
              ) : (
                <X className="h-4 w-4 text-white" />
              )}
            </button>
          </div>
        ))}

        {/* Add image button */}
        {existingImages.length < maxImages && (
          <label
            htmlFor="image-upload"
            className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-md flex flex-col items-center justify-center cursor-pointer aspect-square hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
          >
            <div className="flex flex-col items-center justify-center p-4">
              <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-600 mb-2" />
              <span className="text-xs text-center text-gray-500 dark:text-gray-400">
                Add Image
                <br />
                <span className="text-[10px]">Max 5MB</span>
              </span>
            </div>
            <input
              id="image-upload"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageChange}
              disabled={isUploading || existingImages.length >= maxImages}
              multiple
            />
          </label>
        )}
      </div>

      {/* Uploading indicator */}
      {isUploading && (
        <div className="w-full flex items-center justify-center py-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent"></div>
            <span>Uploading...</span>
          </div>
        </div>
      )}

      {/* Error message */}
      {uploadError && (
        <div className="w-full flex items-center text-red-500 space-x-1 text-sm p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
          <AlertCircle className="h-4 w-4" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Upload instructions */}
      {!isUploading && !uploadError && existingImages.length < maxImages && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {existingImages.length > 0
            ? `${existingImages.length} of ${maxImages} images uploaded`
            : `Add up to ${maxImages} images`}
        </p>
      )}
    </div>
  );
}
