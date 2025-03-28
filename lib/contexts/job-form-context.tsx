"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

// Define step enum for tracking progress
export enum JobFormStep {
  ClientInfo = 0,
  JobDetails = 1,
  PaintingPreferences = 2,
  ProjectScope = 3,
  AdditionalRequirements = 4,
  Review = 5,
}

// Define path mapping
export const stepPaths = {
  [JobFormStep.ClientInfo]: "/post-job/client-info",
  [JobFormStep.JobDetails]: "/post-job/job-details",
  [JobFormStep.PaintingPreferences]: "/post-job/painting-preferences",
  [JobFormStep.ProjectScope]: "/post-job/project-scope",
  [JobFormStep.AdditionalRequirements]: "/post-job/additional-requirements",
  [JobFormStep.Review]: "/post-job/review",
};

// Get step from path
export const getStepFromPath = (path: string): JobFormStep => {
  const normalizedPath = path.endsWith("/") ? path.slice(0, -1) : path;
  const step = Object.entries(stepPaths).find(([_, p]) => p === normalizedPath);
  return step ? (Number(step[0]) as JobFormStep) : JobFormStep.ClientInfo;
};

// Define required fields for each step
export const requiredFields: Record<JobFormStep, (keyof JobFormData)[]> = {
  [JobFormStep.ClientInfo]: ["email", "phone"],
  [JobFormStep.JobDetails]: [
    "jobLocation",
    "paintingAreas",
    "surfaceCondition",
  ],
  [JobFormStep.PaintingPreferences]: ["paintType"],
  [JobFormStep.ProjectScope]: ["startDate"],
  [JobFormStep.AdditionalRequirements]: [],
  [JobFormStep.Review]: [],
};

// Define form data interface
export interface JobFormData {
  // Client Information
  email: string;
  phone: string;

  // Job Details
  propertyType: string;
  jobLocation: string;
  paintingAreas: string[];
  surfaceCondition: string;

  // Painting Preferences
  paintType: string;
  colorPreferences: string;
  specialFinishes: string;

  // Project Scope
  estimatedArea: string;
  startDate?: Date;
  endDate?: Date;

  // Additional Requirements
  furnitureMoving: boolean;
  scaffolding: boolean;
  additionalNotes: string;
  images: string[];
}

// Initial form data
export const initialFormData: JobFormData = {
  // Client Information
  email: "",
  phone: "",

  // Job Details
  propertyType: "residential",
  jobLocation: "",
  paintingAreas: [],
  surfaceCondition: "",

  // Painting Preferences
  paintType: "normal",
  colorPreferences: "",
  specialFinishes: "",

  // Project Scope
  estimatedArea: "",

  // Additional Requirements
  furnitureMoving: false,
  scaffolding: false,
  additionalNotes: "",
  images: [],
};

// Define validation interface
export interface ValidationErrors {
  [key: string]: string;
}

// Actions for form state management
type JobFormAction =
  | { type: "UPDATE_FIELD"; field: keyof JobFormData; value: any }
  | { type: "SET_STEP"; step: JobFormStep }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "LOAD_SAVED_DATA"; data: JobFormData }
  | { type: "RESET_FORM" }
  | { type: "SET_COMPLETED_STEP"; step: JobFormStep };

// State interface
interface JobFormState {
  formData: JobFormData;
  currentStep: JobFormStep;
  completedSteps: Set<JobFormStep>;
  errors: ValidationErrors;
}

// Initial state
const initialState: JobFormState = {
  formData: initialFormData,
  currentStep: JobFormStep.ClientInfo,
  completedSteps: new Set(),
  errors: {},
};

// Reducer function
function jobFormReducer(
  state: JobFormState,
  action: JobFormAction
): JobFormState {
  switch (action.type) {
    case "UPDATE_FIELD":
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.field]: action.value,
        },
      };

    case "SET_STEP":
      return {
        ...state,
        currentStep: action.step,
      };

    case "NEXT_STEP":
      const nextStep = state.currentStep + 1;
      if (nextStep > JobFormStep.Review) return state;
      return {
        ...state,
        currentStep: nextStep,
        completedSteps: new Set([...state.completedSteps, state.currentStep]),
      };

    case "PREV_STEP":
      const prevStep = state.currentStep - 1;
      if (prevStep < JobFormStep.ClientInfo) return state;
      return {
        ...state,
        currentStep: prevStep,
      };

    case "LOAD_SAVED_DATA":
      return {
        ...state,
        formData: action.data,
      };

    case "RESET_FORM":
      return initialState;

    case "SET_COMPLETED_STEP":
      return {
        ...state,
        completedSteps: new Set([...state.completedSteps, action.step]),
      };

    default:
      return state;
  }
}

// Create context
interface JobFormContextProps {
  state: JobFormState;
  updateField: (field: keyof JobFormData, value: any) => void;
  setStep: (step: JobFormStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  validateStep: (step: JobFormStep) => boolean;
  resetForm: () => void;
  loadSavedData: (data: JobFormData) => void;
  isStepCompleted: (step: JobFormStep) => boolean;
  errors: ValidationErrors;
  setErrors: React.Dispatch<React.SetStateAction<ValidationErrors>>;
  isFieldRequired: (field: keyof JobFormData) => boolean;
}

const JobFormContext = createContext<JobFormContextProps | undefined>(
  undefined
);

// Provider component
export function JobFormProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(jobFormReducer, initialState);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const router = useRouter();
  const pathname = usePathname();

  // Load saved data from localStorage on initial render
  useEffect(() => {
    try {
      const savedData = localStorage.getItem("jobFormData");
      if (savedData) {
        const parsedData = JSON.parse(savedData);

        // Convert date strings back to Date objects if they exist
        if (parsedData.startDate)
          parsedData.startDate = new Date(parsedData.startDate);
        if (parsedData.endDate)
          parsedData.endDate = new Date(parsedData.endDate);

        dispatch({ type: "LOAD_SAVED_DATA", data: parsedData });
      }
    } catch (error) {
      console.error("Error loading saved data:", error);
    }
  }, []);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("jobFormData", JSON.stringify(state.formData));
    } catch (error) {
      console.error("Error saving data:", error);
    }
  }, [state.formData]);

  // Sync step with URL path
  useEffect(() => {
    const currentStepFromPath = getStepFromPath(pathname);
    if (currentStepFromPath !== state.currentStep) {
      dispatch({ type: "SET_STEP", step: currentStepFromPath });
    }
  }, [pathname, state.currentStep]);

  // Memoize this function to avoid recreating it on every render
  const areRequiredFieldsFilled = useCallback(
    (step: JobFormStep): boolean => {
      const fieldsForStep = requiredFields[step];
      return fieldsForStep.every((field) => {
        const value = state.formData[field];
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        return !!value;
      });
    },
    [state.formData]
  );

  // Memoize this function to avoid recreating it on every render
  const updateField = useCallback(
    (field: keyof JobFormData, value: any) => {
      dispatch({ type: "UPDATE_FIELD", field, value });

      // Clear error for this field when it's updated
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  // Memoize this function to avoid recreating it on every render
  const setStep = useCallback(
    (step: JobFormStep) => {
      dispatch({ type: "SET_STEP", step });

      // Navigate to the corresponding path
      const targetPath = stepPaths[step];
      if (pathname !== targetPath) {
        try {
          router.push(targetPath);
        } catch (error) {
          console.error("Navigation error:", error);
          window.location.href = targetPath;
        }
      }
    },
    [pathname, router]
  );

  // Validation function needs to be defined before it's used in nextStep
  const validateStep = useCallback(
    (step: JobFormStep): boolean => {
      const newErrors: ValidationErrors = {};
      let isValid = true;

      // Validation for Client Info step
      if (step === JobFormStep.ClientInfo) {
        if (!state.formData.email) {
          newErrors.email = "Email is required";
          isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(state.formData.email)) {
          newErrors.email = "Email is invalid";
          isValid = false;
        }

        if (!state.formData.phone) {
          newErrors.phone = "Phone number is required";
          isValid = false;
        }
      }

      // Validation for Job Details step
      else if (step === JobFormStep.JobDetails) {
        if (!state.formData.jobLocation) {
          newErrors.jobLocation = "Job location is required";
          isValid = false;
        }

        if (state.formData.paintingAreas.length === 0) {
          newErrors.paintingAreas = "Select at least one area to be painted";
          isValid = false;
        }

        if (!state.formData.surfaceCondition) {
          newErrors.surfaceCondition = "Surface condition is required";
          isValid = false;
        }
      }

      // Validation for Painting Preferences step
      else if (step === JobFormStep.PaintingPreferences) {
        if (!state.formData.paintType) {
          newErrors.paintType = "Paint type is required";
          isValid = false;
        }
      }

      // Validation for Project Scope step
      else if (step === JobFormStep.ProjectScope) {
        if (!state.formData.startDate) {
          newErrors.startDate = "Start date is required";
          isValid = false;
        }

        if (
          state.formData.estimatedArea &&
          isNaN(Number(state.formData.estimatedArea))
        ) {
          newErrors.estimatedArea = "Estimated area must be a number";
          isValid = false;
        }

        if (
          state.formData.startDate &&
          state.formData.endDate &&
          state.formData.startDate > state.formData.endDate
        ) {
          newErrors.endDate = "End date must be after start date";
          isValid = false;
        }
      }

      if (!isValid) {
        toast.error("Please fill in all required fields");
      }

      setErrors(newErrors);
      return isValid;
    },
    [state.formData]
  );

  // Memoize these functions to avoid recreating them on every render
  const nextStep = useCallback(() => {
    if (validateStep(state.currentStep)) {
      dispatch({ type: "NEXT_STEP" });
      router.push(stepPaths[(state.currentStep + 1) as JobFormStep]);
    }
  }, [state.currentStep, router, validateStep]);

  const prevStep = useCallback(() => {
    dispatch({ type: "PREV_STEP" });
    router.push(stepPaths[(state.currentStep - 1) as JobFormStep]);
  }, [state.currentStep, router]);

  const resetForm = useCallback(() => {
    dispatch({ type: "RESET_FORM" });
    localStorage.removeItem("jobFormData");
  }, []);

  const loadSavedData = useCallback((data: JobFormData) => {
    dispatch({ type: "LOAD_SAVED_DATA", data });
  }, []);

  const isStepCompleted = useCallback(
    (step: JobFormStep): boolean => {
      return state.completedSteps.has(step);
    },
    [state.completedSteps]
  );

  const isFieldRequired = useCallback((field: keyof JobFormData): boolean => {
    return Object.values(requiredFields).some((fields) =>
      fields.includes(field)
    );
  }, []);

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(
    () => ({
      state,
      updateField,
      setStep,
      nextStep,
      prevStep,
      validateStep,
      resetForm,
      loadSavedData,
      isStepCompleted,
      errors,
      setErrors,
      isFieldRequired,
    }),
    [
      state,
      updateField,
      setStep,
      nextStep,
      prevStep,
      validateStep,
      resetForm,
      loadSavedData,
      isStepCompleted,
      errors,
      isFieldRequired,
    ]
  );

  return (
    <JobFormContext.Provider value={contextValue}>
      {children}
    </JobFormContext.Provider>
  );
}

// Hook for using context
export function useJobForm() {
  const context = useContext(JobFormContext);
  if (!context) {
    throw new Error("useJobForm must be used within a JobFormProvider");
  }
  return context;
}
