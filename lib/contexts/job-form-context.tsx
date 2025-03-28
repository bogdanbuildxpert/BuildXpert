"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
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
      console.error("Error saving form data:", error);
    }
  }, [state.formData]);

  // Sync step with URL path
  useEffect(() => {
    const currentStepFromPath = getStepFromPath(pathname);
    if (currentStepFromPath !== state.currentStep) {
      dispatch({ type: "SET_STEP", step: currentStepFromPath });
    }
  }, [pathname, state.currentStep]);

  // Check if all required fields for a step are filled
  const areRequiredFieldsFilled = (step: JobFormStep): boolean => {
    const fields = requiredFields[step];

    for (const field of fields) {
      const value = state.formData[field];

      // Check empty values
      if (value === undefined || value === null || value === "") {
        return false;
      }

      // Check empty arrays
      if (Array.isArray(value) && value.length === 0) {
        return false;
      }
    }

    return true;
  };

  // Context functions
  const updateField = (field: keyof JobFormData, value: any) => {
    dispatch({ type: "UPDATE_FIELD", field, value });

    // Clear error for this field if exists
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const setStep = (step: JobFormStep) => {
    // First check if user can navigate to this step
    // They can only navigate to steps they've completed or the next available step
    const canNavigate =
      step <= state.currentStep ||
      isStepCompleted(step - 1) ||
      step === Math.max(...Array.from(state.completedSteps)) + 1 ||
      step === 0;

    if (canNavigate) {
      dispatch({ type: "SET_STEP", step });
      router.push(stepPaths[step]);
    } else {
      toast.error("Please complete the previous steps first");
    }
  };

  const nextStep = () => {
    if (validateStep(state.currentStep)) {
      dispatch({ type: "SET_COMPLETED_STEP", step: state.currentStep });
      dispatch({ type: "NEXT_STEP" });
      router.push(stepPaths[(state.currentStep + 1) as JobFormStep]);
    }
  };

  const prevStep = () => {
    dispatch({ type: "PREV_STEP" });
    router.push(stepPaths[(state.currentStep - 1) as JobFormStep]);
  };

  const validateStep = (step: JobFormStep): boolean => {
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
  };

  const resetForm = () => {
    dispatch({ type: "RESET_FORM" });
    setErrors({});
    localStorage.removeItem("jobFormData");
  };

  const loadSavedData = (data: JobFormData) => {
    dispatch({ type: "LOAD_SAVED_DATA", data });
  };

  const isStepCompleted = (step: JobFormStep): boolean => {
    return state.completedSteps.has(step);
  };

  const isFieldRequired = (field: keyof JobFormData): boolean => {
    return Object.values(requiredFields).some((fields) =>
      fields.includes(field)
    );
  };

  // Provide context value
  const contextValue: JobFormContextProps = {
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
  };

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
