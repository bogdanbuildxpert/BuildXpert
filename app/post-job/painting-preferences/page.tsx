"use client";

import { useJobForm } from "@/lib/contexts/job-form-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function PaintingPreferencesPage() {
  const { state, updateField, nextStep, prevStep, errors, isFieldRequired } =
    useJobForm();
  const { formData } = state;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Painting Preferences</h2>
      <p className="text-muted-foreground">
        Tell us about your painting preferences and specifications.
        <span className="text-sm block mt-1 text-red-500">
          * Required fields
        </span>
      </p>

      <div className="space-y-6">
        {/* Paint Type */}
        <div className="space-y-3">
          <Label>
            Paint Type
            {isFieldRequired("paintType") && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </Label>
          <RadioGroup
            value={formData.paintType}
            onValueChange={(value) => updateField("paintType", value)}
            className="flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="normal" id="normal" />
              <Label htmlFor="normal" className="cursor-pointer">
                Standard Paint
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="eco-friendly" id="eco-friendly" />
              <Label htmlFor="eco-friendly" className="cursor-pointer">
                Eco-Friendly/Low VOC
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="premium" id="premium" />
              <Label htmlFor="premium" className="cursor-pointer">
                Premium Quality
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="specialty" id="specialty" />
              <Label htmlFor="specialty" className="cursor-pointer">
                Specialty Paint (moisture resistant, fire retardant, etc.)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="undecided" id="undecided" />
              <Label htmlFor="undecided" className="cursor-pointer">
                Undecided - Need Recommendations
              </Label>
            </div>
          </RadioGroup>
          {errors.paintType && (
            <p className="text-red-500 text-sm">{errors.paintType}</p>
          )}
        </div>

        {/* Color Preferences */}
        <div className="space-y-2">
          <Label htmlFor="colorPreferences">
            Color Preferences
            {isFieldRequired("colorPreferences") && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </Label>
          <Textarea
            id="colorPreferences"
            placeholder="Describe your color preferences (e.g., warm neutrals, specific brand colors, etc.)"
            value={formData.colorPreferences}
            onChange={(e) => updateField("colorPreferences", e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <p className="text-xs text-muted-foreground">
            If you have specific colors in mind, mention them here, or describe
            the look you're going for.
          </p>
        </div>

        {/* Special Finishes */}
        <div className="space-y-2">
          <Label htmlFor="specialFinishes">
            Special Finishes
            {isFieldRequired("specialFinishes") && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </Label>
          <Textarea
            id="specialFinishes"
            placeholder="Any special finishes you're interested in (e.g., textured, matte, glossy, etc.)"
            value={formData.specialFinishes}
            onChange={(e) => updateField("specialFinishes", e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Describe any special painting techniques or finishes you'd like to
            include.
          </p>
        </div>
      </div>

      <div className="pt-4 flex justify-between">
        <Button variant="outline" onClick={prevStep}>
          Previous
        </Button>
        <Button onClick={nextStep}>Next Step</Button>
      </div>
    </div>
  );
}
