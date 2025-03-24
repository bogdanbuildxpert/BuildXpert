"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function LogoutButton() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      // Call the logout function from auth context
      // The updated logout function will handle all cookie clearing
      // and redirection, so we don't need to do it here
      await logout();

      // Show success message
      toast.success("Logged out successfully");

      // No need to redirect here as the logout function now handles it
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error during logout. Please try again.");
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
    >
      <LogOut className="h-4 w-4" />
      <span>Logout</span>
    </Button>
  );
}
