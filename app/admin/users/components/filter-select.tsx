"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  options: FilterOption[];
  defaultValue: string;
  placeholder: string;
  paramName: string;
}

export function FilterSelect({
  options,
  defaultValue,
  placeholder,
  paramName,
}: FilterSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onValueChange(value: string) {
    // Create a new URLSearchParams object
    const params = new URLSearchParams(searchParams.toString());

    // Update or remove the parameter
    if (value && value !== "all") {
      params.set(paramName, value);
    } else {
      params.delete(paramName);
    }

    // Create the new URL
    const newUrl = `${window.location.pathname}?${params.toString()}`;

    // Navigate to the new URL
    router.push(newUrl);
  }

  return (
    <Select onValueChange={onValueChange} defaultValue={defaultValue}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
