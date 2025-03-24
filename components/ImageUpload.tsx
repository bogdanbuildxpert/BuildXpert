import { useState, useCallback, useEffect, useRef } from "react";
import { ImageIcon, X, AlertCircle } from "lucide-react";
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
  initialImage?: string;
  maxImages?: number;
  bucket?: string;
  path?: string;
  className?: string;
  existingImages?: string[];
  onRemoveImage?: (imageUrl: string) => void;
}

export default function ImageUpload({
  onImageUpload,
  initialImage,
  maxImages = 10,
  bucket = "app-images",
  path = "",
  className = "",
  existingImages = [],
  onRemoveImage,
}: ImageUploadProps) {
  // Use refs to avoid rerenders during file uploads
  const uploadingRef = useRef(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [images, setImages] = useState<
    { file: File | null; preview: string; uploading: boolean; error?: string }[]
  >([]);

  // Initialize with initial image if provided - only run once
  useEffect(() => {
    if (initialImage && images.length === 0) {
      setImages([{ file: null, preview: initialImage, uploading: false }]);
    }

    // Cleanup function to revoke object URLs on unmount
    return () => {
      images.forEach((image) => {
        if (image.preview && !image.preview.startsWith("http")) {
          revokeImagePreview(image.preview);
        }
      });
    };
  }, [initialImage]); // Only depend on initialImage, not images

  const uploadToSupabase = useCallback(
    async (file: File, index: number) => {
      try {
        // Clear any previous errors
        setUploadError(null);

        // Update image state to show it's uploading
        setImages((prev) => {
          const updated = [...prev];
          if (index < updated.length) {
            updated[index] = {
              ...updated[index],
              uploading: true,
              error: undefined,
            };
          }
          return updated;
        });

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

          // Update the image in state
          setImages((prev) => {
            const updated = [...prev];
            if (index < updated.length) {
              updated[index] = {
                file: null,
                preview: url,
                uploading: false,
                error: undefined,
              };
            }
            return updated;
          });

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

        setImages((prev) => {
          const updated = [...prev];
          if (index < updated.length) {
            updated[index] = {
              ...updated[index],
              uploading: false,
              error: errorMessage,
            };
          }
          return updated;
        });

        return null;
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
        if (images.length + files.length > maxImages) {
          toast.error(`You can only upload a maximum of ${maxImages} images`);
          setIsUploading(false);
          return;
        }

        // Process each selected file
        const newImagesPromises = files.map(async (file) => {
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

            // Create a preview URL
            const preview = createImagePreview(compressedFile);

            return { file: compressedFile, preview, uploading: true };
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
            const errorMsg =
              error instanceof Error ? error.message : "Unknown error";
            toast.error(`Failed to process ${file.name}: ${errorMsg}`);
            return null;
          }
        });

        const results = await Promise.all(newImagesPromises);
        const validImages = results.filter(
          (
            result
          ): result is { file: File; preview: string; uploading: boolean } =>
            result !== null
        );

        console.log(`${validImages.length} file(s) ready for upload`);

        // Update state with new images
        const startIndex = images.length;
        setImages((prev) => [...prev, ...validImages]);

        // Automatically upload the new images
        for (let i = 0; i < validImages.length; i++) {
          if (validImages[i].file) {
            console.log(`Starting upload for file ${i + 1}`);
            await uploadToSupabase(validImages[i].file, startIndex + i);
          }
        }

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
    [images, maxImages, uploadToSupabase]
  );

  const removeImage = useCallback((index: number) => {
    setImages((prev) => {
      const newImages = [...prev];

      // Revoke the object URL if it's a local preview
      if (
        newImages[index].preview &&
        !newImages[index].preview.startsWith("http")
      ) {
        revokeImagePreview(newImages[index].preview);
      }

      newImages.splice(index, 1);
      return newImages;
    });
  }, []);

  // Retry a failed upload
  const retryUpload = useCallback(
    (index: number) => {
      const image = images[index];
      if (image && image.file) {
        uploadToSupabase(image.file, index);
      }
    },
    [images, uploadToSupabase]
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {uploadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center mb-4">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <p className="text-sm">{uploadError}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        {images.map((image, index) => (
          <div
            key={index}
            className={`relative w-32 h-32 border rounded-md overflow-hidden group ${
              image.error ? "border-red-300" : ""
            }`}
          >
            <Image
              src={image.preview}
              alt={`Preview ${index + 1}`}
              fill
              className={`object-cover ${image.uploading ? "opacity-50" : ""} ${
                image.error ? "opacity-30" : ""
              }`}
            />
            {image.uploading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="animate-spin h-6 w-6 text-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            )}
            {image.error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-500 mb-1" />
                <button
                  onClick={() => retryUpload(index)}
                  className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded"
                >
                  Retry
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove image"
              disabled={image.uploading}
            >
              <X size={16} />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <label
            className={`flex items-center justify-center w-32 h-32 border border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors ${
              isUploading ? "opacity-50" : ""
            }`}
          >
            <div className="flex flex-col items-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <span className="text-xs mt-1 text-muted-foreground text-center">
                {isUploading ? "Uploading..." : "Add Image"}
                <span className="block text-[10px] opacity-80">Max 5MB</span>
              </span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        )}
      </div>
    </div>
  );
}
