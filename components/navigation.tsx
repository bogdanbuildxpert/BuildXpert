"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
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
import { ThemeToggle } from "@/components/ThemeToggle";

export function Navigation() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const isAdmin = user?.role === "ADMIN";

  return (
    <header className="shadow-border relative">
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

            <ThemeToggle />

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <User size={16} />
                        {user.name ? user.name : user.email}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile">Profile</Link>
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
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              className="p-2"
              onClick={toggleMenu}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
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
