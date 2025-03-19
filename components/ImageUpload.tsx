import { useState, useCallback, useEffect } from "react";
import { ImageIcon, X } from "lucide-react";
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
}

export default function ImageUpload({
  onImageUpload,
  initialImage,
  maxImages = 10,
  bucket = "app-images",
  path = "",
  className = "",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [images, setImages] = useState<
    { file: File | null; preview: string; uploading: boolean }[]
  >([]);

  // Initialize with initial image if provided
  useEffect(() => {
    if (initialImage) {
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
  }, [initialImage, images]);

  const uploadToSupabase = useCallback(
    async (file: File, index: number) => {
      try {
        // Update image state to show it's uploading
        setImages((prev) => {
          const updated = [...prev];
          updated[index] = { ...updated[index], uploading: true };
          return updated;
        });

        // Add detailed debug logs
        console.log(`Uploading to bucket: ${bucket}, path: ${path || "root"}`);
        console.log(
          `File: ${file.name}, size: ${(file.size / 1024).toFixed(2)}KB`
        );

        const { url, error } = await uploadImage(file, bucket, path);

        if (error) {
          console.error("Error uploading image:", error);
          console.error("Error details:", JSON.stringify(error, null, 2));
          toast.error(`Failed to upload ${file.name}`);

          // Mark as not uploading anymore
          setImages((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], uploading: false };
            return updated;
          });

          return null;
        }

        if (url) {
          console.log(`Upload successful. Image URL: ${url}`);

          // Update the image in state
          setImages((prev) => {
            const updated = [...prev];
            updated[index] = { file: null, preview: url, uploading: false };
            return updated;
          });

          // Call the callback with uploaded URL
          onImageUpload(url);
          return url;
        }

        return null;
      } catch (error) {
        console.error("Error uploading to Supabase:", error);
        setImages((prev) => {
          const updated = [...prev];
          updated[index] = { ...updated[index], uploading: false };
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

      try {
        const files = Array.from(e.target.files);

        // Check if adding these files would exceed the maximum
        if (images.length + files.length > maxImages) {
          toast.error(`You can only upload a maximum of ${maxImages} images`);
          setIsUploading(false);
          return;
        }

        // Process each selected file
        const newImagesPromises = files.map(async (file) => {
          try {
            // Validate file size before compression
            if (file.size > 5 * 1024 * 1024) {
              toast.error(`${file.name} is too large. Maximum size is 5MB.`);
              return null;
            }

            // Compress the image
            const compressedFile = await compressImage(file);

            // Create a preview URL
            const preview = createImagePreview(compressedFile);

            return { file: compressedFile, preview, uploading: true };
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
            toast.error(`Failed to process ${file.name}`);
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

        // Update state with new images
        const startIndex = images.length;
        setImages((prev) => [...prev, ...validImages]);

        // Automatically upload the new images
        validImages.forEach((image, i) => {
          if (image.file) {
            uploadToSupabase(image.file, startIndex + i);
          }
        });

        // Reset the input value so the same file can be selected again
        e.target.value = "";
      } catch (error) {
        console.error("Error processing images:", error);
        toast.error("Failed to process images");
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

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-wrap gap-4">
        {images.map((image, index) => (
          <div
            key={index}
            className="relative w-32 h-32 border rounded-md overflow-hidden group"
          >
            <Image
              src={image.preview}
              alt={`Preview ${index + 1}`}
              fill
              className={`object-cover ${image.uploading ? "opacity-50" : ""}`}
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
