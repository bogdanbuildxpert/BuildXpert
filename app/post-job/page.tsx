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

export default function PostJobPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

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

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?from=/post-job");
    }

    // Pre-fill email if user is logged in
    if (user && user.email && !formData.email) {
      setFormData((prev) => ({
        ...prev,
        email: user.email,
      }));
    }
  }, [user, authLoading, router, formData.email]);

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

    if (!user) {
      toast.error("You must be logged in to post a job");
      return;
    }

    setIsLoading(true);

    try {
      // Format the data for submission
      const jobData = {
        title: `Painting Job - ${formData.propertyType} Property in ${
          formData.jobLocation.split(",")[0]
        }`,
        description: generateJobDescription(),
        location: formData.jobLocation,
        type: "CONTRACT",
        posterId: user.id,
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
        },
      };

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        throw new Error("Failed to post job");
      }

      toast.success("Job posted successfully");
      router.push("/jobs");
    } catch (error) {
      console.error("Error posting job:", error);
      toast.error("Failed to post job");
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages = Array.from(e.target.files).map((file) =>
        URL.createObjectURL(file)
      );
      setImages([...images, ...newImages]);
    }
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
                    placeholder="Describe any damage (cracks, holes), old paint removal required, or special preparation needed"
                    value={formData.surfaceCondition}
                    onChange={handleChange}
                    className="min-h-[80px] max-h-[80px] resize-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Detailed information about surface conditions helps painters
                    prepare accurate quotes
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
                    placeholder="List special finishes separated by commas"
                    value={formData.specialFinishes}
                    onChange={handleChange}
                    required
                    className="min-h-[80px] max-h-[80px] resize-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  />
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
        </form>
      </div>
    </div>
  );
}
