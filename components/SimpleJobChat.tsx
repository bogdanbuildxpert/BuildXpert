"use client";

import { useAuth } from "@/lib/auth-context";

interface SimpleJobChatProps {
  jobId: string;
  jobPosterId: string;
}

export function SimpleJobChat({ jobId, jobPosterId }: SimpleJobChatProps) {
  // Chat is completely hidden
  return null;
}
