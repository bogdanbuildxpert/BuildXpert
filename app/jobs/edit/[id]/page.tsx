"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2, X, ArrowLeft } from "lucide-react";
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
import Link from "next/link";

interface JobEditPageProps {
  params: {
    id: string;
  };
}

export default function JobEditPage({ params }: JobEditPageProps) {
  const { id } = params;
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [originalJobData, setOriginalJobData] = useState<any>(null);

  const [formData, setFormData] = useState({
    // Basic Job Info (for API)
    title: "",
    description: "",
    location: "",
    type: "CONTRACT",
    status: "OPEN",

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

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/jobs/${id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch job");
        }

        const data = await response.json();
        setOriginalJobData(data);

        // Check if the user is the owner of this job
        if (user && data.poster.id !== user.id && user.role !== "ADMIN") {
          toast.error("You don't have permission to edit this job");
          router.push("/jobs");
          return;
        }

        // Extract metadata from the job
        const metadata = data.metadata || {};

        // Set dates if available
        if (metadata.startDate) {
          setStartDate(new Date(metadata.startDate));
        }
        if (metadata.endDate) {
          setEndDate(new Date(metadata.endDate));
        }

        setFormData({
          // Basic job info
          title: data.title || "",
          description: data.description || "",
          location: data.location || "",
          type: data.type || "CONTRACT",
          status: data.status || "OPEN",

          // Client Information
          email: metadata.email || user?.email || "",
          phone: metadata.phone || "",

          // Job Details
          propertyType: metadata.propertyType || "residential",
          jobLocation: metadata.jobLocation || data.location || "",
          paintingAreas: metadata.paintingAreas || [],
          surfaceCondition: metadata.surfaceCondition || "",

          // Painting Preferences
          paintType: metadata.paintType || "normal",
          colorPreferences: metadata.colorPreferences || "",
          specialFinishes: metadata.specialFinishes || "",

          // Project Scope
          estimatedArea: metadata.estimatedArea || "",

          // Additional Requirements
          furnitureMoving: metadata.furnitureMoving || false,
          scaffolding: metadata.scaffolding || false,

          // Additional Notes
          additionalNotes: metadata.additionalNotes || "",
        });
      } catch (error) {
        console.error("Error fetching job:", error);
        toast.error("Failed to load job details");
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchJob();
    }
  }, [id, user, authLoading, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: checked,
    }));
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Format the data for submission
      const jobData = {
        title: `Painting Job - ${formData.propertyType} Property in ${
          formData.jobLocation.split(",")[0]
        }`,
        description: generateJobDescription(),
        location: formData.jobLocation,
        type: "CONTRACT",
        status: formData.status,
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
          userName: user?.name || user?.email,
          startDate: startDate ? format(startDate, "yyyy-MM-dd") : null,
          endDate: endDate ? format(endDate, "yyyy-MM-dd") : null,
        },
      };

      const response = await fetch(`/api/jobs/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle specific error cases
        if (response.status === 401) {
          toast.error("You need to be logged in to edit this job");
          router.push("/login");
          return;
        }

        if (response.status === 403) {
          // Check if it's a status-related error
          if (errorData.error === "Only administrators can change job status") {
            toast.error("Only administrators can change job status");
            // Reset the status to the original value
            setFormData((prev) => ({
              ...prev,
              status: originalJobData.status || "OPEN", // Use the original status from the data
            }));
            setIsSaving(false);
            return;
          } else {
            toast.error("You don't have permission to edit this job");
            router.push("/jobs");
            return;
          }
        }

        throw new Error(errorData.error || "Failed to update job");
      }

      toast.success("Job updated successfully");
      router.push(`/jobs/${id}`);
    } catch (error) {
      console.error("Error updating job:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update job"
      );
    } finally {
      setIsSaving(false);
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

  const clearDate = (dateType: "start" | "end") => {
    if (dateType === "start") {
      setStartDate(undefined);
    } else {
      setEndDate(undefined);
    }
  };

  // Custom calendar component with custom styling
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
        initialFocus
        className="rounded-md border"
        classNames={{
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

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || isLoading) {
    return (
      <div className="container py-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading job details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-16 md:py-24">
      <div className="space-y-8 fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/jobs">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Edit Painting Job</h1>
            <p className="text-muted-foreground">
              Update your painting job details to find the right professionals.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Accordion
            type="single"
            collapsible
            defaultValue="client-info"
            className="w-full"
          >
            {/* Client Information Section */}
            <AccordionItem value="client-info">
              <AccordionTrigger className="text-lg font-semibold">
                Client Information
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Job Details Section */}
            <AccordionItem value="job-details">
              <AccordionTrigger className="text-lg font-semibold">
                Job Details
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
                  <Label htmlFor="jobLocation" className="text-sm font-medium">
                    Job Location (Full Address)
                  </Label>
                  <Textarea
                    id="jobLocation"
                    placeholder="Enter the full address of the site"
                    value={formData.jobLocation}
                    onChange={handleChange}
                    required
                    className="min-h-[80px] max-h-[80px] resize-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Please provide the complete address where the painting work
                    will be done
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Areas to Be Painted</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "Walls",
                      "Ceilings",
                      "Woodwork",
                      "Furniture",
                      "Exterior",
                      "Other",
                    ].map((area) => (
                      <div key={area} className="flex items-center space-x-2">
                        <Checkbox
                          id={`area-${area.toLowerCase()}`}
                          checked={formData.paintingAreas.includes(
                            area.toLowerCase()
                          )}
                          onCheckedChange={(checked) =>
                            handleMultiSelectChange(
                              "paintingAreas",
                              area.toLowerCase(),
                              checked as boolean
                            )
                          }
                        />
                        <Label htmlFor={`area-${area.toLowerCase()}`}>
                          {area}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="surfaceCondition"
                    className="text-sm font-medium"
                  >
                    Surface Condition
                  </Label>
                  <Textarea
                    id="surfaceCondition"
                    placeholder="Describe the current condition of the surfaces"
                    value={formData.surfaceCondition}
                    onChange={handleChange}
                    className="min-h-[80px] max-h-[80px] resize-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Mention any damage, peeling, or special preparation needed
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Painting Preferences Section */}
            <AccordionItem value="painting-preferences">
              <AccordionTrigger className="text-lg font-semibold">
                Painting Preferences
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Paint Type</Label>
                  <Select
                    value={formData.paintType}
                    onValueChange={(value) =>
                      handleSelectChange("paintType", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select paint type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Standard Paint</SelectItem>
                      <SelectItem value="eco-friendly">
                        Eco-Friendly Paint
                      </SelectItem>
                      <SelectItem value="premium">Premium Paint</SelectItem>
                      <SelectItem value="specialized">
                        Specialized Paint
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="colorPreferences"
                    className="text-sm font-medium"
                  >
                    Color Preferences
                  </Label>
                  <Textarea
                    id="colorPreferences"
                    placeholder="Specific colors or custom mixing required"
                    value={formData.colorPreferences}
                    onChange={handleChange}
                    required
                    className="min-h-[80px] max-h-[80px] resize-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Include color codes, brand preferences, or describe the
                    desired color scheme
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Special Finishes</Label>
                  <Textarea
                    id="specialFinishes"
                    placeholder="Enter special finishes"
                    value={formData.specialFinishes}
                    onChange={handleChange}
                    required
                    className="min-h-[80px] max-h-[80px] resize-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Separate finishes with commas
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Project Scope Section */}
            <AccordionItem value="project-scope">
              <AccordionTrigger className="text-lg font-semibold">
                Project Scope
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="estimatedArea">Estimated Area</Label>
                  <Input
                    id="estimatedArea"
                    placeholder="Square meters of the painting area"
                    value={formData.estimatedArea}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Timeline</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Desired Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? (
                              format(startDate, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            {startDate && (
                              <X
                                className="ml-auto h-4 w-4 opacity-50 hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearDate("start");
                                }}
                              />
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CustomCalendar
                            selected={startDate}
                            onSelect={setStartDate}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">Desired End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !endDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? (
                              format(endDate, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            {endDate && (
                              <X
                                className="ml-auto h-4 w-4 opacity-50 hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearDate("end");
                                }}
                              />
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CustomCalendar
                            selected={endDate}
                            onSelect={setEndDate}
                            disabled={(date) =>
                              date <
                              new Date(
                                new Date(startDate || new Date()).setHours(
                                  0,
                                  0,
                                  0,
                                  0
                                )
                              )
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
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
                      Furniture Moving and Protection Required
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
                    <Label htmlFor="scaffolding">Scaffolding Required</Label>
                  </div>
                </div>
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

            {/* Basic Job Information Section */}
            <AccordionItem value="basic-info" defaultChecked>
              <AccordionTrigger className="text-lg font-semibold">
                Basic Job Information
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                {/* Admin-only status control */}
                {user && user.role === "ADMIN" && (
                  <div className="space-y-2 p-3 border border-yellow-200 bg-yellow-50 rounded-md">
                    <Label htmlFor="status" className="font-medium">
                      Job Status (Admin Only)
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        handleSelectChange("status", value)
                      }
                    >
                      <SelectTrigger id="status" className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="FILLED">Filled</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Changing the status will affect how this job appears to
                      users.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Type of Job</Label>
                  <RadioGroup
                    value={formData.type}
                    onValueChange={(value) => handleSelectChange("type", value)}
                    className="flex flex-row space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="CONTRACT" id="type-contract" />
                      <Label htmlFor="type-contract">Contract</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="HOURLY" id="type-hourly" />
                      <Label htmlFor="type-hourly">Hourly</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="FIXED_PRICE"
                        id="type-fixed-price"
                      />
                      <Label htmlFor="type-fixed-price">Fixed Price</Label>
                    </div>
                  </RadioGroup>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/jobs")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
