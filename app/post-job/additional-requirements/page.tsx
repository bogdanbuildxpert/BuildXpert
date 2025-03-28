"use client";

import { useState } from "react";
import { useJobForm } from "@/lib/contexts/job-form-context";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, X } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";

export default function AdditionalRequirementsPage() {
  const { state, updateField, nextStep, prevStep, errors, isFieldRequired } =
    useJobForm();
  const { formData } = state;
  const [isUploading, setIsUploading] = useState(false);

  // Function to handle image upload from the ImageUpload component
  const handleImageUpload = (imageUrl: string) => {
    console.log("Image uploaded:", imageUrl);
    updateField("images", [...formData.images, imageUrl]);
    setIsUploading(false);
  };

  // Function to remove an image from the uploaded images
  const handleRemoveImage = (imageUrl: string) => {
    updateField(
      "images",
      formData.images.filter((url) => url !== imageUrl)
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Additional Requirements</h2>
      <p className="text-muted-foreground">
        Tell us about any additional requirements or notes for your project.
        <span className="text-sm block mt-1 text-red-500">
          * Required fields
        </span>
      </p>

      <div className="space-y-6">
        {/* Additional Requirements Checkboxes */}
        <div className="space-y-4">
          <Label>
            Additional Services
            {isFieldRequired("furnitureMoving") && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </Label>
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="furnitureMoving"
                checked={formData.furnitureMoving}
                onCheckedChange={(checked) =>
                  updateField("furnitureMoving", checked === true)
                }
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="furnitureMoving"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Furniture Moving/Protection
                </Label>
                <p className="text-sm text-muted-foreground">
                  Includes moving and covering furniture during the painting
                  process.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="scaffolding"
                checked={formData.scaffolding}
                onCheckedChange={(checked) =>
                  updateField("scaffolding", checked === true)
                }
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="scaffolding"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Scaffolding Required
                </Label>
                <p className="text-sm text-muted-foreground">
                  Work requires scaffolding or special equipment for high areas.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        <div className="space-y-2">
          <Label htmlFor="additionalNotes">
            Additional Notes
            {isFieldRequired("additionalNotes") && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </Label>
          <Textarea
            id="additionalNotes"
            placeholder="Any other details or special requests..."
            value={formData.additionalNotes}
            onChange={(e) => updateField("additionalNotes", e.target.value)}
            className="min-h-[100px] resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Include any special instructions, access information, or other
            details that will help with your project.
          </p>
        </div>

        {/* Image Upload */}
        <div className="space-y-3">
          <Label>
            Reference Images
            {isFieldRequired("images") && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </Label>
          <div className="grid grid-cols-1 gap-4">
            {/* Image upload component */}
            <div className="relative">
              <ImageUpload
                onImageUpload={handleImageUpload}
                onRemoveImage={handleRemoveImage}
                existingImages={formData.images}
                maxImages={10}
                path="job-applications"
              />
              {isUploading && (
                <div className="flex items-center mt-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm">Uploading image...</span>
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Upload images to provide visual references for your project.
          </p>
        </div>
      </div>

      <div className="pt-4 flex justify-between">
        <Button variant="outline" onClick={prevStep}>
          Previous
        </Button>
        <Button onClick={nextStep}>Review & Submit</Button>
      </div>
    </div>
  );
}
