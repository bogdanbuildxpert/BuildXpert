"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  User,
  LogOut,
  Bell,
  Trash2,
  MessageSquare,
  Loader2,
} from "lucide-react";
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
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

export function Navigation() {
  const { user, logout } = useAuth();
  const {
    unreadCount,
    notifications,
    loading,
    clearAllNotifications,
    fetchNotifications,
    markNotificationAsRead,
  } = useNotifications();
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

  const handleNotificationClick = async (messageId: string, jobId: string) => {
    // Mark the notification as read
    await markNotificationAsRead(messageId);

    // Navigate to the job chat
    router.push(`/jobs/${jobId}`);
  };

  const isAdmin = user?.role === "ADMIN";

  // Add a function to refresh notifications
  const refreshNotifications = () => {
    if (user) {
      fetchNotifications();
    }
  };

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
                  <DropdownMenu
                    onOpenChange={(open) => {
                      if (open) refreshNotifications();
                    }}
                  >
                    <DropdownMenuTrigger asChild>
                      <div className="relative cursor-pointer">
                        <Bell
                          size={20}
                          className="text-primary hover:text-primary/80"
                        />
                        {unreadCount > 0 && (
                          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                      <DropdownMenuLabel className="flex items-center justify-between">
                        <span>Notifications</span>
                        {loading && (
                          <Loader2 size={16} className="animate-spin" />
                        )}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      {notifications.length === 0 ? (
                        <div className="py-4 px-2 text-center text-muted-foreground">
                          {loading
                            ? "Loading notifications..."
                            : "No new notifications"}
                        </div>
                      ) : (
                        <>
                          <ScrollArea className="h-[300px]">
                            {notifications.map((notification) => (
                              <DropdownMenuItem
                                key={notification.id}
                                className="flex flex-col items-start p-3 cursor-pointer hover:bg-accent"
                                onClick={() =>
                                  handleNotificationClick(
                                    notification.id,
                                    notification.jobId
                                  )
                                }
                              >
                                <div className="flex items-start gap-2 w-full">
                                  <MessageSquare
                                    size={16}
                                    className="text-primary mt-1 flex-shrink-0"
                                  />
                                  <div className="flex-1 overflow-hidden">
                                    <div className="font-medium text-sm">
                                      {notification.sender?.name ||
                                        notification.sender?.email ||
                                        "Unknown sender"}
                                    </div>
                                    <div className="text-xs text-muted-foreground mb-1">
                                      {notification.job?.title || "Job message"}
                                    </div>
                                    <p className="text-sm line-clamp-2 text-foreground/80">
                                      {notification.content}
                                    </p>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {formatDistanceToNow(
                                        new Date(notification.createdAt),
                                        { addSuffix: true }
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </DropdownMenuItem>
                            ))}
                          </ScrollArea>
                          <DropdownMenuSeparator />
                        </>
                      )}

                      <div className="p-2 flex flex-col gap-1">
                        <DropdownMenuItem asChild>
                          <Link
                            href="/messages"
                            className="flex items-center justify-center w-full"
                          >
                            View all messages
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={handleDeleteAllNotifications}
                          disabled={
                            isDeletingNotifications || unreadCount === 0
                          }
                          className={`cursor-pointer flex justify-center ${
                            unreadCount > 0 ? "text-red-500" : "text-gray-400"
                          }`}
                        >
                          {isDeletingNotifications ? (
                            <>
                              <Loader2
                                size={16}
                                className="mr-2 animate-spin"
                              />
                              <span>Clearing...</span>
                            </>
                          ) : (
                            <>
                              <Trash2 size={16} className="mr-2" />
                              Clear all notifications
                            </>
                          )}
                        </DropdownMenuItem>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                      <DropdownMenuItem asChild>
                        <Link
                          href="/messages"
                          className="flex items-center justify-between w-full"
                        >
                          <span>Messages</span>
                          {unreadCount > 0 && (
                            <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                          )}
                        </Link>
                      </DropdownMenuItem>
                      {isAdmin && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin/dashboard">Admin Dashboard</Link>
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
                  <Link
                    href="/messages"
                    className="flex items-center py-2 text-sm"
                    onClick={() => {
                      setIsMenuOpen(false);
                      refreshNotifications();
                    }}
                  >
                    <Bell size={16} className="mr-2" />
                    Messages
                    {unreadCount > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin/dashboard"
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
