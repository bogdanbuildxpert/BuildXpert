"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  useJobForm,
  JobFormStep,
  stepPaths,
} from "@/lib/contexts/job-form-context";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

export default function Stepper() {
  const pathname = usePathname();
  const { state, setStep, isStepCompleted } = useJobForm();
  const { currentStep } = state;
  const containerRef = useRef<HTMLDivElement>(null);

  const steps = [
    { id: JobFormStep.ClientInfo, label: "Client Info" },
    { id: JobFormStep.JobDetails, label: "Job Details" },
    { id: JobFormStep.PaintingPreferences, label: "Painting Preferences" },
    { id: JobFormStep.ProjectScope, label: "Project Scope" },
    {
      id: JobFormStep.AdditionalRequirements,
      label: "Additional Requirements",
    },
    { id: JobFormStep.Review, label: "Review" },
  ];

  const handleStepClick = (step: JobFormStep) => {
    // Only allow navigation to completed steps or the current step + 1
    if (
      isStepCompleted(step) ||
      step === currentStep ||
      step === currentStep + 1
    ) {
      setStep(step);
    }
  };

  // Calculate progression percentage for the active progress bar
  const calculateProgressWidth = () => {
    if (currentStep === 0) return "0%";
    return `${(currentStep / (steps.length - 1)) * 100}%`;
  };

  return (
    <div className="w-full relative pb-6">
      <div
        className="flex items-center justify-between relative"
        ref={containerRef}
      >
        {/* Progress track container - positioned to align with circles */}
        <div className="absolute inset-x-0" style={{ top: "20px" }}>
          {/* Background track - gray line across all steps */}
          <div className="w-full h-0.5 bg-gray-200 absolute"></div>

          {/* Active progress track - green progress bar */}
          {currentStep > 0 && (
            <div
              className="h-0.5 bg-green-500 absolute left-0 transition-all duration-500 ease-in-out"
              style={{ width: calculateProgressWidth() }}
            ></div>
          )}
        </div>

        {/* Step indicators - circles with numbers/checkmarks */}
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center z-10">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 bg-white",
                isStepCompleted(step.id)
                  ? "border-green-500 bg-green-500 text-white"
                  : step.id === currentStep
                  ? "border-primary bg-primary text-white"
                  : "border-gray-300 text-gray-400 cursor-not-allowed"
              )}
              onClick={() => handleStepClick(step.id)}
              role="button"
              tabIndex={0}
            >
              {isStepCompleted(step.id) ? (
                <CheckIcon className="h-5 w-5" />
              ) : (
                <span className="text-sm font-semibold">{index + 1}</span>
              )}
            </div>
            <div className="text-xs mt-2 max-w-[80px] text-center">
              {step.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
