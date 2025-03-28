"use client";

import { useState } from "react";
import { useJobForm } from "@/lib/contexts/job-form-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CustomCalendar } from "@/components/CustomCalendar";

export default function ProjectScopePage() {
  const { state, updateField, nextStep, prevStep, errors, isFieldRequired } =
    useJobForm();
  const { formData } = state;

  // Convert string dates to Date objects for the calendar
  const [startDate, setStartDate] = useState<Date | undefined>(
    formData.startDate
  );
  const [endDate, setEndDate] = useState<Date | undefined>(formData.endDate);

  // Function to clear a date
  const clearDate = (dateType: "start" | "end") => {
    if (dateType === "start") {
      setStartDate(undefined);
      updateField("startDate", undefined);
      // If start date is cleared and end date is before current date, also clear end date
      if (endDate && endDate < new Date()) {
        setEndDate(undefined);
        updateField("endDate", undefined);
      }
    } else {
      setEndDate(undefined);
      updateField("endDate", undefined);
    }
  };

  // Handle date changes
  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    updateField("startDate", date);
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
    updateField("endDate", date);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Project Scope & Timeline</h2>
      <p className="text-muted-foreground">
        Define the scope and timeline for your painting project.
        <span className="text-sm block mt-1 text-red-500">
          * Required fields
        </span>
      </p>

      <div className="space-y-6">
        {/* Estimated Area */}
        <div className="space-y-2">
          <Label htmlFor="estimatedArea">
            Estimated Area (sq ft)
            {isFieldRequired("estimatedArea") && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </Label>
          <Input
            id="estimatedArea"
            type="text"
            placeholder="e.g. 1000"
            value={formData.estimatedArea}
            onChange={(e) => updateField("estimatedArea", e.target.value)}
            className={errors.estimatedArea ? "border-red-500" : ""}
          />
          {errors.estimatedArea && (
            <p className="text-red-500 text-sm">{errors.estimatedArea}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Provide an approximate area to be painted to help with estimating.
          </p>
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          <Label>Project Timeline</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                Desired Start Date
                {isFieldRequired("startDate") && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="startDate"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal relative",
                      !startDate && "text-muted-foreground",
                      !startDate &&
                        isFieldRequired("startDate") &&
                        "border-red-300"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Select date"}
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
                    onSelect={handleStartDateChange}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
              {errors.startDate && (
                <p className="text-red-500 text-sm">{errors.startDate}</p>
              )}
              <p className="text-xs text-muted-foreground">
                When would you like the work to begin?
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">
                Desired Completion Date
                {isFieldRequired("endDate") && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </Label>
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
                    onSelect={handleEndDateChange}
                    disabled={(date) => date < (startDate || new Date())}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                When would you like the project to be finished?
              </p>
            </div>
          </div>
          {errors.endDate && (
            <p className="text-red-500 text-sm">{errors.endDate}</p>
          )}
        </div>
      </div>

      <div className="pt-4 flex justify-between">
        <Button variant="outline" onClick={prevStep}>
          Previous
        </Button>
        <Button onClick={nextStep}>Next Step</Button>
      </div>
    </div>
  );
}
