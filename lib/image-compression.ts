import imageCompression from "browser-image-compression";

// Options for the image compression
interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  maxIteration?: number;
}

/**
 * Compresses an image file using browser-image-compression
 * @param imageFile - The original image file to compress
 * @param customOptions - Optional custom compression settings
 * @returns A Promise resolving to the compressed image file
 */
export async function compressImage(
  imageFile: File,
  customOptions?: CompressionOptions
): Promise<File> {
  // Default compression options
  const defaultOptions = {
    maxSizeMB: 2, // Max size in MB
    maxWidthOrHeight: 1920, // Max width/height in pixels
    useWebWorker: true, // Use web worker for better performance
    maxIteration: 10, // Max compression iterations
  };

  // Merge default and custom options
  const options = { ...defaultOptions, ...customOptions };

  try {
    // Check if file is too large (5MB max)
    if (imageFile.size > 5 * 1024 * 1024) {
      throw new Error("File is too large. Maximum size is 5MB.");
    }

    // Check if the file is an image
    if (!imageFile.type.startsWith("image/")) {
      throw new Error("File is not an image");
    }

    // Check if compression is needed based on file size
    if (imageFile.size / 1024 / 1024 < options.maxSizeMB) {
      console.log(
        "Image already smaller than target size, skipping compression"
      );
      return imageFile;
    }

    console.log("Original image size:", imageFile.size / 1024 / 1024, "MB");

    // Compress the image
    const compressedFile = await imageCompression(imageFile, options);

    console.log(
      "Compressed image size:",
      compressedFile.size / 1024 / 1024,
      "MB"
    );

    return compressedFile;
  } catch (error) {
    console.error("Error compressing image:", error);
    // Return original file if compression fails
    return imageFile;
  }
}

/**
 * Creates a preview URL for an image file
 * @param file - The image file to preview
 * @returns A string URL for the image preview
 */
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revokes a preview URL to free up memory
 * @param previewUrl - The URL to revoke
 */
export function revokeImagePreview(previewUrl: string): void {
  URL.revokeObjectURL(previewUrl);
}
