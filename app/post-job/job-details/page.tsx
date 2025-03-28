"use client";

import { useJobForm } from "@/lib/contexts/job-form-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useTheme } from "next-themes";

export default function JobDetailsPage() {
  const { state, updateField, nextStep, prevStep, errors, isFieldRequired } =
    useJobForm();
  const { formData } = state;
  const { theme } = useTheme();

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
        Let us know the basic details of your painting job.
        <span className="text-sm block mt-1 text-red-500 dark:text-red-400">
          * Required fields
        </span>
      </p>

      <div className="space-y-6">
        {/* Property Type */}
        <div className="space-y-2">
          <Label className="text-base font-medium dark:text-gray-200">
            Property Type
            {isFieldRequired("propertyType") && (
              <span className="text-red-500 dark:text-red-400 ml-1">*</span>
            )}
          </Label>
          <RadioGroup
            value={formData.propertyType}
            onValueChange={(value) => updateField("propertyType", value)}
            className="grid grid-cols-1 md:grid-cols-2 gap-2"
            required={isFieldRequired("propertyType")}
          >
            <div className="flex items-center space-x-2 rounded-md border p-3 dark:border-gray-700 dark:hover:bg-gray-800">
              <RadioGroupItem value="Residential" id="residential" />
              <Label
                htmlFor="residential"
                className="flex-1 cursor-pointer dark:text-gray-200"
              >
                Residential
              </Label>
            </div>
            <div className="flex items-center space-x-2 rounded-md border p-3 dark:border-gray-700 dark:hover:bg-gray-800">
              <RadioGroupItem value="Commercial" id="commercial" />
              <Label
                htmlFor="commercial"
                className="flex-1 cursor-pointer dark:text-gray-200"
              >
                Commercial
              </Label>
            </div>
            <div className="flex items-center space-x-2 rounded-md border p-3 dark:border-gray-700 dark:hover:bg-gray-800">
              <RadioGroupItem value="Industrial" id="industrial" />
              <Label
                htmlFor="industrial"
                className="flex-1 cursor-pointer dark:text-gray-200"
              >
                Industrial
              </Label>
            </div>
            <div className="flex items-center space-x-2 rounded-md border p-3 dark:border-gray-700 dark:hover:bg-gray-800">
              <RadioGroupItem value="Other" id="other" />
              <Label
                htmlFor="other"
                className="flex-1 cursor-pointer dark:text-gray-200"
              >
                Other
              </Label>
            </div>
          </RadioGroup>
          {errors.propertyType && (
            <p className="text-red-500 dark:text-red-400 text-sm">
              {errors.propertyType}
            </p>
          )}
        </div>

        {/* Painting Areas */}
        <div className="space-y-3">
          <Label className="text-base font-medium dark:text-gray-200">
            Areas to be Painted
            {isFieldRequired("paintingAreas") && (
              <span className="text-red-500 dark:text-red-400 ml-1">*</span>
            )}
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {paintingAreas.map((area) => (
              <div
                key={area}
                className="flex items-center space-x-2 rounded-md border p-3 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <Checkbox
                  id={area.toLowerCase().replace(/\s+/g, "-")}
                  checked={formData.paintingAreas.includes(area)}
                  onCheckedChange={(checked) =>
                    handlePaintingAreaChange(area, !!checked)
                  }
                />
                <Label
                  htmlFor={area.toLowerCase().replace(/\s+/g, "-")}
                  className="flex-1 cursor-pointer dark:text-gray-200"
                >
                  {area}
                </Label>
              </div>
            ))}
          </div>
          {errors.paintingAreas && (
            <p className="text-red-500 dark:text-red-400 text-sm">
              {errors.paintingAreas}
            </p>
          )}
        </div>

        {/* Surface Condition */}
        <div className="space-y-2">
          <Label className="text-base font-medium dark:text-gray-200">
            Surface Condition
            {isFieldRequired("surfaceCondition") && (
              <span className="text-red-500 dark:text-red-400 ml-1">*</span>
            )}
          </Label>
          <RadioGroup
            value={formData.surfaceCondition}
            onValueChange={(value) => updateField("surfaceCondition", value)}
            className="grid grid-cols-1 md:grid-cols-2 gap-2"
            required={isFieldRequired("surfaceCondition")}
          >
            <div className="flex items-center space-x-2 rounded-md border p-3 dark:border-gray-700 dark:hover:bg-gray-800">
              <RadioGroupItem value="Good - Minor touchups needed" id="good" />
              <Label
                htmlFor="good"
                className="flex-1 cursor-pointer dark:text-gray-200"
              >
                Good - Minor touchups needed
              </Label>
            </div>
            <div className="flex items-center space-x-2 rounded-md border p-3 dark:border-gray-700 dark:hover:bg-gray-800">
              <RadioGroupItem value="Fair - Some repairs needed" id="fair" />
              <Label
                htmlFor="fair"
                className="flex-1 cursor-pointer dark:text-gray-200"
              >
                Fair - Some repairs needed
              </Label>
            </div>
            <div className="flex items-center space-x-2 rounded-md border p-3 dark:border-gray-700 dark:hover:bg-gray-800">
              <RadioGroupItem
                value="Poor - Significant preparation required"
                id="poor"
              />
              <Label
                htmlFor="poor"
                className="flex-1 cursor-pointer dark:text-gray-200"
              >
                Poor - Significant preparation required
              </Label>
            </div>
            <div className="flex items-center space-x-2 rounded-md border p-3 dark:border-gray-700 dark:hover:bg-gray-800">
              <RadioGroupItem value="New surfaces" id="new" />
              <Label
                htmlFor="new"
                className="flex-1 cursor-pointer dark:text-gray-200"
              >
                New surfaces
              </Label>
            </div>
          </RadioGroup>
          {errors.surfaceCondition && (
            <p className="text-red-500 dark:text-red-400 text-sm">
              {errors.surfaceCondition}
            </p>
          )}
        </div>
      </div>

      <div className="pt-4 flex justify-between">
        <Button variant="outline" onClick={prevStep}>
          Previous
        </Button>
        <Button onClick={nextStep}>Next</Button>
      </div>
    </div>
  );
}
