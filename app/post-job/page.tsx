"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  poster: {
    id: string;
    name: string | null;
    email: string;
  };
  metadata?: {
    propertyType?: string;
    paintingAreas?: string[];
    surfaceCondition?: string;
    paintType?: string;
    colorPreferences?: string;
    specialFinishes?: string;
    estimatedArea?: number;
    startDate?: string;
    endDate?: string;
    furnitureMoving?: boolean;
    scaffolding?: boolean;
    additionalNotes?: string;
    images?: string[];
  };
}

export default function PostJobPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [activeAccordion, setActiveAccordion] = useState<string>("client-info");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const [formData, setFormData] = useState({
    // Client Information
    email: "",
    phone: "",

    // Job Details
    propertyType: "residential",
    jobLocation: "",
    paintingAreas: [] as string[],
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

    // Additional Notes
    additionalNotes: "",
  });

  // Map fields to their accordion sections
  const fieldToAccordionMap: Record<string, string> = {
    email: "client-info",
    phone: "client-info",
    jobLocation: "job-details",
    paintingAreas: "job-details",
    surfaceCondition: "job-details",
    colorPreferences: "painting-preferences",
    specialFinishes: "painting-preferences",
    estimatedArea: "project-scope",
  };

  // Add this array of accordion sections in order
  const accordionSections = [
    "client-info",
    "job-details",
    "painting-preferences",
    "project-scope",
    "additional-requirements",
    "attachments",
    "additional-notes",
  ];

  // Add progress tracking
  const [completedSections, setCompletedSections] = useState<Set<string>>(
    new Set()
  );

  // Add function to check section completion
  const isSectionComplete = (section: string) => {
    switch (section) {
      case "client-info":
        return formData.email && formData.phone;
      case "job-details":
        return formData.jobLocation && formData.paintingAreas.length > 0;
      case "painting-preferences":
        return formData.colorPreferences || formData.specialFinishes;
      case "project-scope":
        return formData.estimatedArea;
      default:
        return true;
    }
  };

  // Update handleNextSection to include completion tracking
  const handleNextSection = () => {
    const currentIndex = accordionSections.indexOf(activeAccordion);
    if (currentIndex < accordionSections.length - 1) {
      // Mark current section as complete if it passes validation
      if (isSectionComplete(activeAccordion)) {
        setCompletedSections((prev) => new Set([...prev, activeAccordion]));
      }
      setActiveAccordion(accordionSections[currentIndex + 1]);
    }
  };

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Enter" && e.ctrlKey && !isLastSection()) {
        handleNextSection();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [activeAccordion]);

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/post-job");
    }
  }, [user, authLoading, router]);

  // Don't render anything if user is not authenticated (prevents flash of content before redirect)
  if (!user) {
    return null;
  }

  // Clear validation error when a field is updated
  const clearValidationError = (field: string) => {
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
    clearValidationError(id);
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    clearValidationError(field);
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: checked,
    }));
    clearValidationError(field);
  };

  const handleMultiSelectChange = (
    field: keyof typeof formData,
    value: string,
    checked: boolean
  ) => {
    setFormData((prev) => {
      const currentValues = prev[field] as string[];

      if (checked) {
        return { ...prev, [field]: [...currentValues, value] };
      } else {
        return {
          ...prev,
          [field]: currentValues.filter((item) => item !== value),
        };
      }
    });
    clearValidationError(field);
  };

  // Validate all required fields regardless of visibility
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate required fields
    if (!formData.email) errors.email = "Email is required";
    if (!formData.phone) errors.phone = "Phone number is required";
    if (!formData.jobLocation) errors.jobLocation = "Job location is required";
    if (formData.paintingAreas.length === 0)
      errors.paintingAreas = "Select at least one painting area";
    if (!formData.surfaceCondition)
      errors.surfaceCondition = "Surface condition is required";
    if (!formData.colorPreferences)
      errors.colorPreferences = "Color preferences are required";
    if (!formData.specialFinishes)
      errors.specialFinishes = "Special finishes information is required";
    if (!formData.estimatedArea)
      errors.estimatedArea = "Estimated area is required";

    setValidationErrors(errors);

    // If there are errors, expand the first accordion with errors
    if (Object.keys(errors).length > 0) {
      // Find the first field with an error and get its accordion section
      const firstErrorField = Object.keys(errors)[0];
      const accordionToOpen = fieldToAccordionMap[firstErrorField];

      if (accordionToOpen) {
        setActiveAccordion(accordionToOpen);
      }

      // Scroll to the top of the form
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Show toast with error message
      toast.error("Please fill in all required fields");
    }

    return Object.keys(errors).length === 0;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Limit to 5 images
      const filesToProcess = Array.from(e.target.files).slice(0, 5);

      // Process each file to create object URLs
      const newImages = filesToProcess.map((file) => URL.createObjectURL(file));

      // Store the actual files for later processing
      const fileReaders = filesToProcess.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(file);
        });
      });

      // Store the promises for later resolution during form submission
      setFileReaderPromises(fileReaders);

      // Update the UI with image previews
      setImages([...images, ...newImages]);
    }
  };

  // State to store FileReader promises
  const [fileReaderPromises, setFileReaderPromises] = useState<
    Promise<string>[]
  >([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to post a job");
      router.push("/login?from=/post-job");
      return;
    }

    // Validate all fields before submission
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Resolve all image promises to get base64 data
      let imageData: string[] = [];
      if (fileReaderPromises.length > 0) {
        try {
          imageData = await Promise.all(fileReaderPromises);
        } catch (error) {
          console.error("Error processing images:", error);
          // Continue with submission even if image processing fails
        }
      }

      // Format the data for submission
      const jobData = {
        title: `Painting Job - ${formData.propertyType} Property in ${
          formData.jobLocation.split(",")[0]
        }`,
        description: generateJobDescription(),
        location: formData.jobLocation,
        metadata: {
          email: formData.email,
          phone: formData.phone,
          propertyType: formData.propertyType,
          jobLocation: formData.jobLocation,
          paintingAreas: formData.paintingAreas,
          surfaceCondition: formData.surfaceCondition,
          paintType: formData.paintType,
          colorPreferences: formData.colorPreferences,
          specialFinishes: formData.specialFinishes,
          estimatedArea: formData.estimatedArea,
          furnitureMoving: formData.furnitureMoving,
          scaffolding: formData.scaffolding,
          additionalNotes: formData.additionalNotes,
          userName: user.name || user.email,
          startDate: startDate ? format(startDate, "yyyy-MM-dd") : null,
          endDate: endDate ? format(endDate, "yyyy-MM-dd") : null,
          images: imageData, // Add the image data to metadata
        },
      };

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobData),
        credentials: "include", // Include cookies in the request
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          // Unauthorized - redirect to login
          toast.error("Your session has expired. Please log in again.");
          router.push("/login?from=/post-job");
          return;
        }
        throw new Error(errorData.error || "Failed to post job");
      }

      toast.success("Job posted successfully");
      router.push("/jobs");
    } catch (error) {
      console.error("Error posting job:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to post job"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const generateJobDescription = () => {
    return `
Posted by: ${user?.name || user?.email || "Anonymous"}
Property Type: ${formData.propertyType}
Location: ${formData.jobLocation}
Areas to be Painted: ${formData.paintingAreas.join(", ")}
Surface Condition: ${formData.surfaceCondition}
Paint Type: ${formData.paintType}
Color Preferences: ${formData.colorPreferences}
Special Finishes: ${formData.specialFinishes}
Estimated Area: ${formData.estimatedArea}
Timeline: ${startDate ? format(startDate, "PPP") : "Not specified"} to ${
      endDate ? format(endDate, "PPP") : "Not specified"
    }
Additional Requirements: ${
      formData.furnitureMoving ? "Furniture moving/protection needed. " : ""
    }${formData.scaffolding ? "Scaffolding required. " : ""}
Additional Notes: ${formData.additionalNotes}
    `.trim();
  };

  // Function to clear a date
  const clearDate = (dateType: "start" | "end") => {
    if (dateType === "start") {
      setStartDate(undefined);
      // If start date is cleared and end date is before current date, also clear end date
      if (endDate && endDate < new Date()) {
        setEndDate(undefined);
      }
    } else {
      setEndDate(undefined);
    }
  };

  // Custom calendar component with proper day of week alignment
  const CustomCalendar = ({
    selected,
    onSelect,
    disabled,
  }: {
    selected: Date | undefined;
    onSelect: (date: Date | undefined) => void;
    disabled: (date: Date) => boolean;
  }) => {
    return (
      <Calendar
        mode="single"
        selected={selected}
        onSelect={onSelect}
        disabled={disabled}
        className="rounded-md border shadow p-3"
        weekStartsOn={1} // Monday as first day
        fixedWeeks
        showOutsideDays={false}
        classNames={{
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          nav: "space-x-1 flex items-center",
          nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell:
            "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside: "text-muted-foreground opacity-50",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle:
            "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
        }}
      />
    );
  };

  // Add function to check if it's the last section
  const isLastSection = () => {
    return activeAccordion === accordionSections[accordionSections.length - 1];
  };

  if (authLoading) {
    return (
      <div className="container max-w-3xl py-16 md:py-24 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-16 md:py-24">
      <div className="space-y-8 fade-in">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Post a Painting Job</h1>
          <p className="text-muted-foreground">
            Fill out the form below to post your painting job and connect with
            professionals.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Accordion
            type="single"
            collapsible
            value={activeAccordion}
            onValueChange={setActiveAccordion}
            className="w-full"
          >
            {/* Client Information Section */}
            <AccordionItem value="client-info">
              <AccordionTrigger className="text-lg font-semibold">
                Client Information
                {(validationErrors.email || validationErrors.phone) && (
                  <span className="ml-2 text-sm text-destructive">
                    ● Required fields missing
                  </span>
                )}
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center">
                    Email Address
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={
                      validationErrors.email ? "border-destructive" : ""
                    }
                  />
                  {validationErrors.email && (
                    <p className="text-xs text-destructive mt-1">
                      {validationErrors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center">
                    Phone Number
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Input
                    id="phone"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className={
                      validationErrors.phone ? "border-destructive" : ""
                    }
                  />
                  {validationErrors.phone && (
                    <p className="text-xs text-destructive mt-1">
                      {validationErrors.phone}
                    </p>
                  )}
                </div>
                {!isLastSection() && activeAccordion === "client-info" && (
                  <div className="mt-6">
                    <Button
                      type="button"
                      size="lg"
                      className="w-1/4 bg-primary hover:bg-primary/90 text-primary-foreground ml-auto"
                      onClick={handleNextSection}
                      aria-label="Continue to Job Details"
                    >
                      <span className="flex items-center gap-2">
                        Next Section
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </Button>
                    <div className="flex justify-between items-center text-sm text-muted-foreground px-1 mt-2">
                      <span>Section 1 of {accordionSections.length}</span>
                      <span>Press Ctrl+Enter to continue</span>
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Job Details Section */}
            <AccordionItem value="job-details">
              <AccordionTrigger className="text-lg font-semibold">
                Job Details
                {(validationErrors.jobLocation ||
                  validationErrors.paintingAreas ||
                  validationErrors.surfaceCondition) && (
                  <span className="ml-2 text-sm text-destructive">
                    ● Required fields missing
                  </span>
                )}
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Type of Property</Label>
                  <RadioGroup
                    value={formData.propertyType}
                    onValueChange={(value) =>
                      handleSelectChange("propertyType", value)
                    }
                    className="flex flex-row space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="residential"
                        id="property-residential"
                      />
                      <Label htmlFor="property-residential">Residential</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="commercial"
                        id="property-commercial"
                      />
                      <Label htmlFor="property-commercial">Commercial</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="industrial"
                        id="property-industrial"
                      />
                      <Label htmlFor="property-industrial">Industrial</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="jobLocation"
                    className="flex items-center text-sm font-medium"
                  >
                    Job Location (Full Address)
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Textarea
                    id="jobLocation"
                    placeholder="Enter the full address of the site"
                    value={formData.jobLocation}
                    onChange={handleChange}
                    required
                    className={cn(
                      "min-h-[80px] max-h-[80px] resize-none focus:ring-2 focus:ring-primary/20 transition-all text-sm",
                      validationErrors.jobLocation ? "border-destructive" : ""
                    )}
                  />
                  {validationErrors.jobLocation ? (
                    <p className="text-xs text-destructive mt-1">
                      {validationErrors.jobLocation}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      Please provide the complete address where the painting
                      work will be done
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center">
                    Areas to be Painted
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="interior-walls"
                        checked={formData.paintingAreas.includes(
                          "Interior Walls"
                        )}
                        onCheckedChange={(checked) =>
                          handleMultiSelectChange(
                            "paintingAreas",
                            "Interior Walls",
                            checked as boolean
                          )
                        }
                        className={
                          validationErrors.paintingAreas
                            ? "border-destructive"
                            : ""
                        }
                      />
                      <Label htmlFor="interior-walls">Interior Walls</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="exterior-walls"
                        checked={formData.paintingAreas.includes(
                          "Exterior Walls"
                        )}
                        onCheckedChange={(checked) =>
                          handleMultiSelectChange(
                            "paintingAreas",
                            "Exterior Walls",
                            checked as boolean
                          )
                        }
                        className={
                          validationErrors.paintingAreas
                            ? "border-destructive"
                            : ""
                        }
                      />
                      <Label htmlFor="exterior-walls">Exterior Walls</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="ceilings"
                        checked={formData.paintingAreas.includes("Ceilings")}
                        onCheckedChange={(checked) =>
                          handleMultiSelectChange(
                            "paintingAreas",
                            "Ceilings",
                            checked as boolean
                          )
                        }
                        className={
                          validationErrors.paintingAreas
                            ? "border-destructive"
                            : ""
                        }
                      />
                      <Label htmlFor="ceilings">Ceilings</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="trim"
                        checked={formData.paintingAreas.includes(
                          "Trim/Woodwork"
                        )}
                        onCheckedChange={(checked) =>
                          handleMultiSelectChange(
                            "paintingAreas",
                            "Trim/Woodwork",
                            checked as boolean
                          )
                        }
                        className={
                          validationErrors.paintingAreas
                            ? "border-destructive"
                            : ""
                        }
                      />
                      <Label htmlFor="trim">Trim/Woodwork</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="doors"
                        checked={formData.paintingAreas.includes("Doors")}
                        onCheckedChange={(checked) =>
                          handleMultiSelectChange(
                            "paintingAreas",
                            "Doors",
                            checked as boolean
                          )
                        }
                        className={
                          validationErrors.paintingAreas
                            ? "border-destructive"
                            : ""
                        }
                      />
                      <Label htmlFor="doors">Doors</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="cabinets"
                        checked={formData.paintingAreas.includes("Cabinets")}
                        onCheckedChange={(checked) =>
                          handleMultiSelectChange(
                            "paintingAreas",
                            "Cabinets",
                            checked as boolean
                          )
                        }
                        className={
                          validationErrors.paintingAreas
                            ? "border-destructive"
                            : ""
                        }
                      />
                      <Label htmlFor="cabinets">Cabinets</Label>
                    </div>
                  </div>
                  {validationErrors.paintingAreas && (
                    <p className="text-xs text-destructive mt-1">
                      {validationErrors.paintingAreas}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="surfaceCondition"
                    className="flex items-center"
                  >
                    Surface Condition
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Select
                    value={formData.surfaceCondition}
                    onValueChange={(value) =>
                      handleSelectChange("surfaceCondition", value)
                    }
                  >
                    <SelectTrigger
                      className={
                        validationErrors.surfaceCondition
                          ? "border-destructive"
                          : ""
                      }
                    >
                      <SelectValue placeholder="Select surface condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">
                        New Surface (Never Painted)
                      </SelectItem>
                      <SelectItem value="good">
                        Good Condition (Minor Repairs)
                      </SelectItem>
                      <SelectItem value="fair">
                        Fair Condition (Some Repairs Needed)
                      </SelectItem>
                      <SelectItem value="poor">
                        Poor Condition (Major Repairs Needed)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {validationErrors.surfaceCondition && (
                    <p className="text-xs text-destructive mt-1">
                      {validationErrors.surfaceCondition}
                    </p>
                  )}
                </div>
                {!isLastSection() && activeAccordion === "job-details" && (
                  <div className="mt-6">
                    <Button
                      type="button"
                      size="lg"
                      className="w-1/4 bg-primary hover:bg-primary/90 text-primary-foreground ml-auto"
                      onClick={handleNextSection}
                      aria-label="Continue to Painting Preferences"
                    >
                      <span className="flex items-center gap-2">
                        Next Section
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </Button>
                    <div className="flex justify-between items-center text-sm text-muted-foreground px-1 mt-2">
                      <span>Section 2 of {accordionSections.length}</span>
                      <span>Press Ctrl+Enter to continue</span>
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Painting Preferences Section */}
            <AccordionItem value="painting-preferences">
              <AccordionTrigger className="text-lg font-semibold">
                Painting Preferences
                {(validationErrors.colorPreferences ||
                  validationErrors.specialFinishes) && (
                  <span className="ml-2 text-sm text-destructive">
                    ● Required fields missing
                  </span>
                )}
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Paint Type</Label>
                  <RadioGroup
                    value={formData.paintType}
                    onValueChange={(value) =>
                      handleSelectChange("paintType", value)
                    }
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="normal" id="paint-normal" />
                      <Label htmlFor="paint-normal">Standard Paint</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="premium" id="paint-premium" />
                      <Label htmlFor="paint-premium">Premium Paint</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="eco" id="paint-eco" />
                      <Label htmlFor="paint-eco">Eco-Friendly Paint</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="colorPreferences"
                    className="flex items-center text-sm font-medium"
                  >
                    Color Preferences
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Textarea
                    id="colorPreferences"
                    placeholder="Specific colors or custom mixing required"
                    value={formData.colorPreferences}
                    onChange={handleChange}
                    required
                    className={cn(
                      "min-h-[80px] max-h-[80px] resize-none focus:ring-2 focus:ring-primary/20 transition-all text-sm",
                      validationErrors.colorPreferences
                        ? "border-destructive"
                        : ""
                    )}
                  />
                  {validationErrors.colorPreferences ? (
                    <p className="text-xs text-destructive mt-1">
                      {validationErrors.colorPreferences}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      Include color codes, brand preferences, or describe the
                      desired color scheme
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="specialFinishes"
                    className="flex items-center"
                  >
                    Special Finishes
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Textarea
                    id="specialFinishes"
                    placeholder="List special finishes separated by commas"
                    value={formData.specialFinishes}
                    onChange={handleChange}
                    required
                    className={cn(
                      "min-h-[80px] max-h-[80px] resize-none focus:ring-2 focus:ring-primary/20 transition-all text-sm",
                      validationErrors.specialFinishes
                        ? "border-destructive"
                        : ""
                    )}
                  />
                  {validationErrors.specialFinishes && (
                    <p className="text-xs text-destructive mt-1">
                      {validationErrors.specialFinishes}
                    </p>
                  )}
                </div>
                {!isLastSection() &&
                  activeAccordion === "painting-preferences" && (
                    <div className="mt-6">
                      <Button
                        type="button"
                        size="lg"
                        className="w-1/4 bg-primary hover:bg-primary/90 text-primary-foreground ml-auto"
                        onClick={handleNextSection}
                        aria-label="Continue to Project Scope"
                      >
                        <span className="flex items-center gap-2">
                          Next Section
                          <ChevronRight className="h-4 w-4" />
                        </span>
                      </Button>
                      <div className="flex justify-between items-center text-sm text-muted-foreground px-1 mt-2">
                        <span>Section 3 of {accordionSections.length}</span>
                        <span>Press Ctrl+Enter to continue</span>
                      </div>
                    </div>
                  )}
              </AccordionContent>
            </AccordionItem>

            {/* Project Scope Section */}
            <AccordionItem value="project-scope">
              <AccordionTrigger className="text-lg font-semibold">
                Project Scope
                {validationErrors.estimatedArea && (
                  <span className="ml-2 text-sm text-destructive">
                    ● Required fields missing
                  </span>
                )}
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="estimatedArea" className="flex items-center">
                    Estimated Area (in square meters/feet)
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Input
                    id="estimatedArea"
                    placeholder="e.g., 100 sq. meters"
                    value={formData.estimatedArea}
                    onChange={handleChange}
                    required
                    className={
                      validationErrors.estimatedArea ? "border-destructive" : ""
                    }
                  />
                  {validationErrors.estimatedArea && (
                    <p className="text-xs text-destructive mt-1">
                      {validationErrors.estimatedArea}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Timeline</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Desired Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="startDate"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal relative",
                              !startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate
                              ? format(startDate, "PPP")
                              : "Select date"}
                            {startDate && (
                              <div
                                className="absolute right-2 cursor-pointer hover:bg-muted rounded-full p-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearDate("start");
                                }}
                              >
                                <X className="h-4 w-4" />
                              </div>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CustomCalendar
                            selected={startDate}
                            onSelect={setStartDate}
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">Desired Completion Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="endDate"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal relative",
                              !endDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP") : "Select date"}
                            {endDate && (
                              <div
                                className="absolute right-2 cursor-pointer hover:bg-muted rounded-full p-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearDate("end");
                                }}
                              >
                                <X className="h-4 w-4" />
                              </div>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CustomCalendar
                            selected={endDate}
                            onSelect={setEndDate}
                            disabled={(date) =>
                              date < (startDate || new Date())
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
                {!isLastSection() && activeAccordion === "project-scope" && (
                  <div className="mt-6">
                    <Button
                      type="button"
                      size="lg"
                      className="w-1/4 bg-primary hover:bg-primary/90 text-primary-foreground ml-auto"
                      onClick={handleNextSection}
                      aria-label="Continue to Additional Requirements"
                    >
                      <span className="flex items-center gap-2">
                        Next Section
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </Button>
                    <div className="flex justify-between items-center text-sm text-muted-foreground px-1 mt-2">
                      <span>Section 4 of {accordionSections.length}</span>
                      <span>Press Ctrl+Enter to continue</span>
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Additional Requirements Section */}
            <AccordionItem value="additional-requirements">
              <AccordionTrigger className="text-lg font-semibold">
                Additional Requirements
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="furnitureMoving"
                      checked={formData.furnitureMoving}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange(
                          "furnitureMoving",
                          checked as boolean
                        )
                      }
                    />
                    <Label htmlFor="furnitureMoving">
                      Furniture Moving and Protection Needed
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="scaffolding"
                      checked={formData.scaffolding}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("scaffolding", checked as boolean)
                      }
                    />
                    <Label htmlFor="scaffolding">
                      Scaffolding Required for High Areas
                    </Label>
                  </div>
                </div>
                {!isLastSection() &&
                  activeAccordion === "additional-requirements" && (
                    <div className="mt-6">
                      <Button
                        type="button"
                        size="lg"
                        className="w-1/4 bg-primary hover:bg-primary/90 text-primary-foreground ml-auto"
                        onClick={handleNextSection}
                        aria-label="Continue to Attachments"
                      >
                        <span className="flex items-center gap-2">
                          Next Section
                          <ChevronRight className="h-4 w-4" />
                        </span>
                      </Button>
                      <div className="flex justify-between items-center text-sm text-muted-foreground px-1 mt-2">
                        <span>Section 5 of {accordionSections.length}</span>
                        <span>Press Ctrl+Enter to continue</span>
                      </div>
                    </div>
                  )}
              </AccordionContent>
            </AccordionItem>

            {/* Attachments Section */}
            <AccordionItem value="attachments">
              <AccordionTrigger className="text-lg font-semibold">
                Attachments
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Photos of the Site</Label>
                  <div className="border border-dashed border-border rounded-lg p-6 text-center">
                    <div className="flex flex-col items-center space-y-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <div className="text-sm text-muted-foreground">
                        <label
                          htmlFor="image-upload"
                          className="cursor-pointer text-primary hover:underline"
                        >
                          Click to upload
                        </label>
                        <span> or drag and drop</span>
                        <Input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG or JPEG (max. 5MB each)
                      </p>
                    </div>
                  </div>

                  {images.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      {images.map((image, index) => (
                        <div
                          key={index}
                          className="relative aspect-square rounded-md overflow-hidden"
                        >
                          <img
                            src={image || "/placeholder.svg"}
                            alt={`Uploaded image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {!isLastSection() && activeAccordion === "attachments" && (
                  <div className="mt-6">
                    <Button
                      type="button"
                      size="lg"
                      className="w-1/4 bg-primary hover:bg-primary/90 text-primary-foreground ml-auto"
                      onClick={handleNextSection}
                      aria-label="Continue to Additional Notes"
                    >
                      <span className="flex items-center gap-2">
                        Next Section
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </Button>
                    <div className="flex justify-between items-center text-sm text-muted-foreground px-1 mt-2">
                      <span>Section 6 of {accordionSections.length}</span>
                      <span>Press Ctrl+Enter to continue</span>
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Additional Notes Section */}
            <AccordionItem value="additional-notes">
              <AccordionTrigger className="text-lg font-semibold">
                Additional Notes
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="additionalNotes"
                    className="text-sm font-medium"
                  >
                    Additional Information
                  </Label>
                  <Textarea
                    id="additionalNotes"
                    placeholder="Provide any other relevant information or specific requests"
                    className="min-h-[80px] max-h-[80px] resize-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    value={formData.additionalNotes}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Include any special requirements, access instructions, or
                    other details that will help with your project
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex justify-between items-center gap-4">
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading || !user}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting Job...
                </>
              ) : (
                "Post Job"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
