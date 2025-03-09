"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Calendar, MapPin, Send } from "lucide-react"

// This would typically come from a database
const getJobById = (id: string) => {
  return {
    id: Number.parseInt(id),
    title: "Interior Painting - Office Building",
    location: "Dublin City Centre",
    timeline: "2 weeks",
    description:
      "Complete interior painting of a 3-floor office building including walls, ceilings, and trim work. The project requires high-quality finishes suitable for a corporate environment. All materials will be provided, but the contractor needs to bring their own tools and equipment. Work must be completed during weekends to avoid disrupting office operations.",
    postedBy: "ABC Corporation",
    postedDate: "May 10, 2023",
    images: [
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
    ],
    requirements: [
      "Minimum 5 years of experience in commercial painting",
      "Team of at least 3 painters",
      "Must be available to work weekends",
      "Portfolio of previous commercial projects",
      "Insurance and liability coverage",
    ],
  }
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = getJobById(params.id)
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setIsSending(true)
    // Simulate API call
    setTimeout(() => {
      setIsSending(false)
      setMessage("")
      // Show success message
    }, 1000)
  }

  return (
    <div className="container py-16 md:py-24">
      <div className="space-y-12 fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/jobs" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Jobs
            </Link>
          </Button>
          <div className="text-sm text-muted-foreground">
            Posted on {job.postedDate} by {job.postedBy}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h1 className="text-3xl font-bold mb-4">{job.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Timeline: {job.timeline}</span>
                </div>
              </div>
              <p className="text-muted-foreground whitespace-pre-line">{job.description}</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Requirements</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                {job.requirements.map((requirement, index) => (
                  <li key={index}>{requirement}</li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Images</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {job.images.map((image, index) => (
                  <div key={index} className="aspect-[4/3] rounded-lg overflow-hidden border border-border">
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`Job image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="border border-border rounded-lg p-6 space-y-6">
              <h2 className="text-xl font-semibold">Contact Client</h2>
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder="Write your message here..."
                    className="min-h-[150px]"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSending}>
                  {isSending ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" /> Send Message
                    </>
                  )}
                </Button>
              </form>
            </div>

            <div className="border border-border rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-semibold">Similar Jobs</h2>
              <div className="space-y-4">
                <Link
                  href="/jobs/2"
                  className="block p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  <h3 className="font-medium">Exterior Facade Restoration</h3>
                  <p className="text-sm text-muted-foreground">Galway</p>
                </Link>
                <Link
                  href="/jobs/3"
                  className="block p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  <h3 className="font-medium">Commercial Space Repainting</h3>
                  <p className="text-sm text-muted-foreground">Cork</p>
                </Link>
                <Link
                  href="/jobs/5"
                  className="block p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  <h3 className="font-medium">New Construction - Apartment Building</h3>
                  <p className="text-sm text-muted-foreground">Waterford</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

