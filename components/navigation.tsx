"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header className="border-b border-border">
      <div className="container py-4">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            BuildXpert
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/jobs" className="text-sm hover:text-primary/80 transition-colors">
              Jobs
            </Link>
            <Link href="/services" className="text-sm hover:text-primary/80 transition-colors">
              Services
            </Link>
            <Link href="/about" className="text-sm hover:text-primary/80 transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-sm hover:text-primary/80 transition-colors">
              Contact
            </Link>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/post-job">Post a Job</Link>
              </Button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2" onClick={toggleMenu} aria-label={isMenuOpen ? "Close menu" : "Open menu"}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4 fade-in">
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
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

