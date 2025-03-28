"use client";

import { useJobForm } from "@/lib/contexts/job-form-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ClientInfoPage() {
  const { state, updateField, nextStep, errors, isFieldRequired } =
    useJobForm();
  const { formData } = state;

  const handleNext = () => {
    nextStep();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Client Information</h2>
      <p className="text-muted-foreground">
        Let us know how painters can contact you about this job.
        <span className="text-sm block mt-1 text-red-500">
          * Required fields
        </span>
      </p>

      <div className="space-y-4">
        <div>
          <Label htmlFor="email">
            Email
            {isFieldRequired("email") && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="email@example.com"
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
            className={errors.email ? "border-red-500" : ""}
            required={isFieldRequired("email")}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">
            Phone Number
            {isFieldRequired("phone") && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(123) 456-7890"
            value={formData.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            className={errors.phone ? "border-red-500" : ""}
            required={isFieldRequired("phone")}
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
          )}
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <Button onClick={handleNext}>Next Step</Button>
      </div>
    </div>
  );
}
