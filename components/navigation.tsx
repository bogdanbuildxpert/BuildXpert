"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, User, LogOut, Bell, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function Navigation() {
  const { user, logout } = useAuth();
  const { unreadCount, clearAllNotifications } = useNotifications();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeletingNotifications, setIsDeletingNotifications] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    // Clear the user cookie
    document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    // Call the logout function from auth context
    logout();
    router.push("/");
  };

  const handleDeleteAllNotifications = async () => {
    if (!user) return;

    try {
      setIsDeletingNotifications(true);
      const success = await clearAllNotifications();

      if (success) {
        toast.success("All notifications cleared");
        // Refresh the page to show the updated state
        router.refresh();
      } else {
        toast.error("Failed to clear notifications");
      }
    } catch (error) {
      console.error("Error clearing notifications:", error);
      toast.error("Failed to clear notifications");
    } finally {
      setIsDeletingNotifications(false);
    }
  };

  const isAdmin = user?.role === "ADMIN";

  return (
    <header className="border-b border-border">
      <div className="container py-4">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            BuildXpert
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {isAdmin && (
              <Link
                href="/projects"
                className="text-sm hover:text-primary/80 transition-colors"
              >
                Projects
              </Link>
            )}
            <Link
              href="/jobs"
              className="text-sm hover:text-primary/80 transition-colors"
            >
              Jobs
            </Link>
            <Link
              href="/services"
              className="text-sm hover:text-primary/80 transition-colors"
            >
              Services
            </Link>
            <Link
              href="/about"
              className="text-sm hover:text-primary/80 transition-colors"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-sm hover:text-primary/80 transition-colors"
            >
              Contact
            </Link>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  {unreadCount > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div className="relative cursor-pointer">
                          <Bell
                            size={20}
                            className="text-primary hover:text-primary/80"
                          />
                          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/messages" className="flex items-center">
                            View all messages
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={handleDeleteAllNotifications}
                          disabled={isDeletingNotifications}
                          className="text-red-500 cursor-pointer"
                        >
                          {isDeletingNotifications ? (
                            <>
                              <span className="mr-2">Clearing...</span>
                            </>
                          ) : (
                            <>
                              <Trash2 size={16} className="mr-2" />
                              Clear all notifications
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <User size={16} />
                        {user.name || user.email}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile">Profile</Link>
                      </DropdownMenuItem>
                      {unreadCount > 0 && (
                        <DropdownMenuItem asChild>
                          <Link
                            href="/messages"
                            className="flex items-center justify-between w-full"
                          >
                            <span>Messages</span>
                            <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {isAdmin && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin">Admin Dashboard</Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="text-red-500"
                      >
                        <LogOut size={16} className="mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button size="sm" asChild>
                    <Link href="/post-job">Post a Job</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/post-job">Post a Job</Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={toggleMenu}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4 fade-in">
            {isAdmin && (
              <Link
                href="/projects"
                className="block py-2 text-sm hover:text-primary/80 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Projects
              </Link>
            )}
            <Link
              href="/jobs"
              className="block py-2 text-sm hover:text-primary/80 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Jobs
            </Link>
            <Link
              href="/services"
              className="block py-2 text-sm hover:text-primary/80 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Services
            </Link>
            <Link
              href="/about"
              className="block py-2 text-sm hover:text-primary/80 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/contact"
              className="block py-2 text-sm hover:text-primary/80 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
            <div className="flex flex-col space-y-2 pt-2">
              {user ? (
                <>
                  <Link
                    href="/profile"
                    className="flex items-center py-2 text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User size={16} className="mr-2" />
                    My Profile
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center py-2 text-sm"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="justify-start text-red-500"
                  >
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/post-job" onClick={() => setIsMenuOpen(false)}>
                      Post a Job
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                      Login
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/post-job" onClick={() => setIsMenuOpen(false)}>
                      Post a Job
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
