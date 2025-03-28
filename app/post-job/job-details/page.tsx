"use client";

import { useJobForm } from "@/lib/contexts/job-form-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

export default function JobDetailsPage() {
  const { state, updateField, nextStep, prevStep, errors, isFieldRequired } =
    useJobForm();
  const { formData } = state;

  // Available painting areas
  const paintingAreas = [
    "Interior Walls",
    "Exterior Walls",
    "Ceilings",
    "Trim/Baseboards",
    "Doors",
    "Windows",
    "Cabinets",
    "Deck/Patio",
    "Fence",
  ];

  // Handler for painting areas checkbox
  const handlePaintingAreaChange = (area: string, checked: boolean) => {
    if (checked) {
      updateField("paintingAreas", [...formData.paintingAreas, area]);
    } else {
      updateField(
        "paintingAreas",
        formData.paintingAreas.filter((a) => a !== area)
      );
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Job Details</h2>
      <p className="text-muted-foreground">
        Tell us about your painting project.
        <span className="text-sm block mt-1 text-red-500">
          * Required fields
        </span>
      </p>

      <div className="space-y-6">
        {/* Property Type */}
        <div className="space-y-3">
          <Label>
            Property Type
            {isFieldRequired("propertyType") && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </Label>
          <RadioGroup
            value={formData.propertyType}
            onValueChange={(value) => updateField("propertyType", value)}
            className="flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="residential" id="residential" />
              <Label htmlFor="residential" className="cursor-pointer">
                Residential
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="commercial" id="commercial" />
              <Label htmlFor="commercial" className="cursor-pointer">
                Commercial
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="industrial" id="industrial" />
              <Label htmlFor="industrial" className="cursor-pointer">
                Industrial
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Job Location */}
        <div className="space-y-2">
          <Label htmlFor="jobLocation">
            Job Location
            {isFieldRequired("jobLocation") && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </Label>
          <Input
            id="jobLocation"
            placeholder="Enter address or area"
            value={formData.jobLocation}
            onChange={(e) => updateField("jobLocation", e.target.value)}
            className={errors.jobLocation ? "border-red-500" : ""}
            required={isFieldRequired("jobLocation")}
          />
          {errors.jobLocation && (
            <p className="text-red-500 text-sm">{errors.jobLocation}</p>
          )}
        </div>

        {/* Areas to be Painted */}
        <div className="space-y-3">
          <Label>
            Areas to be Painted
            {isFieldRequired("paintingAreas") && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </Label>
          {errors.paintingAreas && (
            <p className="text-red-500 text-sm">{errors.paintingAreas}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {paintingAreas.map((area) => (
              <div key={area} className="flex items-center space-x-2">
                <Checkbox
                  id={`area-${area}`}
                  checked={formData.paintingAreas.includes(area)}
                  onCheckedChange={(checked) =>
                    handlePaintingAreaChange(area, checked === true)
                  }
                  aria-required={isFieldRequired("paintingAreas")}
                />
                <Label htmlFor={`area-${area}`} className="cursor-pointer">
                  {area}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Surface Condition */}
        <div className="space-y-3">
          <Label>
            Surface Condition
            {isFieldRequired("surfaceCondition") && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </Label>
          <RadioGroup
            value={formData.surfaceCondition}
            onValueChange={(value) => updateField("surfaceCondition", value)}
            className="flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="excellent" id="excellent" />
              <Label htmlFor="excellent" className="cursor-pointer">
                Excellent - No repairs needed
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="good" id="good" />
              <Label htmlFor="good" className="cursor-pointer">
                Good - Minor repairs needed
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fair" id="fair" />
              <Label htmlFor="fair" className="cursor-pointer">
                Fair - Some significant repairs needed
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="poor" id="poor" />
              <Label htmlFor="poor" className="cursor-pointer">
                Poor - Major repairs needed
              </Label>
            </div>
          </RadioGroup>
          {errors.surfaceCondition && (
            <p className="text-red-500 text-sm">{errors.surfaceCondition}</p>
          )}
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
