"use client";

import { useJobForm } from "@/lib/contexts/job-form-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";

export default function ClientInfoPage() {
  const { state, updateField, nextStep, errors, isFieldRequired } =
    useJobForm();
  const { formData } = state;
  const { theme } = useTheme();

  const handleNext = () => {
    nextStep();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Client Information</h2>
      <p className="text-muted-foreground">
        Let us know how painters can contact you about this job.
        <span className="text-sm block mt-1 text-red-500 dark:text-red-400">
          * Required fields
        </span>
      </p>

      <div className="space-y-4">
        <div>
          <Label htmlFor="email" className="dark:text-gray-200">
            Email
            {isFieldRequired("email") && (
              <span className="text-red-500 dark:text-red-400 ml-1">*</span>
            )}
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="email@example.com"
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
            className={
              errors.email
                ? "border-red-500 dark:border-red-400"
                : "dark:bg-gray-800 dark:border-gray-700"
            }
            required={isFieldRequired("email")}
          />
          {errors.email && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="phone" className="dark:text-gray-200">
            Phone Number
            {isFieldRequired("phone") && (
              <span className="text-red-500 dark:text-red-400 ml-1">*</span>
            )}
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(123) 456-7890"
            value={formData.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            className={
              errors.phone
                ? "border-red-500 dark:border-red-400"
                : "dark:bg-gray-800 dark:border-gray-700"
            }
            required={isFieldRequired("phone")}
          />
          {errors.phone && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">
              {errors.phone}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="jobLocation" className="dark:text-gray-200">
            Job Location
            {isFieldRequired("jobLocation") && (
              <span className="text-red-500 dark:text-red-400 ml-1">*</span>
            )}
          </Label>
          <Input
            id="jobLocation"
            type="text"
            placeholder="Address or area where the job will be performed"
            value={formData.jobLocation}
            onChange={(e) => updateField("jobLocation", e.target.value)}
            className={
              errors.jobLocation
                ? "border-red-500 dark:border-red-400"
                : "dark:bg-gray-800 dark:border-gray-700"
            }
            required={isFieldRequired("jobLocation")}
          />
          {errors.jobLocation && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">
              {errors.jobLocation}
            </p>
          )}
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  );
}
