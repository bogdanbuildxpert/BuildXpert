"use client";

import React, { useCallback, useMemo } from "react";
import { useJobForm } from "@/lib/contexts/job-form-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";

// Create a memoized form input component to avoid re-renders
const MemoizedFormInput = React.memo(
  ({
    id,
    label,
    type,
    placeholder,
    value,
    onChange,
    required,
    error,
  }: {
    id: string;
    label: string;
    type: string;
    placeholder: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required: boolean;
    error?: string;
  }) => {
    const { theme } = useTheme();

    return (
      <div>
        <Label htmlFor={id} className="dark:text-gray-200">
          {label}
          {required && (
            <span className="text-red-500 dark:text-red-400 ml-1">*</span>
          )}
        </Label>
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={
            error
              ? "border-red-500 dark:border-red-400"
              : "dark:bg-gray-800 dark:border-gray-700"
          }
          required={required}
        />
        {error && (
          <p className="text-red-500 dark:text-red-400 text-sm mt-1">{error}</p>
        )}
      </div>
    );
  }
);

MemoizedFormInput.displayName = "MemoizedFormInput";

// Main component wrapped with React.memo
function ClientInfoPage() {
  const { state, updateField, nextStep, errors, isFieldRequired } =
    useJobForm();
  const { formData } = state;
  const { theme } = useTheme();

  // Memoize event handlers
  const handleNext = useCallback(() => {
    nextStep();
  }, [nextStep]);

  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateField("email", e.target.value);
    },
    [updateField]
  );

  const handlePhoneChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateField("phone", e.target.value);
    },
    [updateField]
  );

  const handleLocationChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateField("jobLocation", e.target.value);
    },
    [updateField]
  );

  // Memoize field requirement checks
  const isEmailRequired = useMemo(
    () => isFieldRequired("email"),
    [isFieldRequired]
  );
  const isPhoneRequired = useMemo(
    () => isFieldRequired("phone"),
    [isFieldRequired]
  );
  const isLocationRequired = useMemo(
    () => isFieldRequired("jobLocation"),
    [isFieldRequired]
  );

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
        <MemoizedFormInput
          id="email"
          label="Email"
          type="email"
          placeholder="email@example.com"
          value={formData.email}
          onChange={handleEmailChange}
          required={isEmailRequired}
          error={errors.email}
        />

        <MemoizedFormInput
          id="phone"
          label="Phone Number"
          type="tel"
          placeholder="(123) 456-7890"
          value={formData.phone}
          onChange={handlePhoneChange}
          required={isPhoneRequired}
          error={errors.phone}
        />

        <MemoizedFormInput
          id="jobLocation"
          label="Job Location"
          type="text"
          placeholder="Address or area where the job will be performed"
          value={formData.jobLocation}
          onChange={handleLocationChange}
          required={isLocationRequired}
          error={errors.jobLocation}
        />
      </div>

      <div className="pt-4 flex justify-end">
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  );
}

// Export the memoized component
export default React.memo(ClientInfoPage);
