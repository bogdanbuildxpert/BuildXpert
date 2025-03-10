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

  const handleLogout = () => {
    // Clear the user cookie
    document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    // Call the logout function from auth context
    logout();

    // Show success message
    toast.success("Logged out successfully");

    // Redirect to home page
    router.push("/");
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
