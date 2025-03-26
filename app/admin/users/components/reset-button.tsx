"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface ResetButtonProps {
  href: string;
  children: React.ReactNode;
}

export function ResetButton({ href, children }: ResetButtonProps) {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      onClick={() => {
        router.push(href);
      }}
    >
      {children}
    </Button>
  );
}
