import Link from "next/link"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// Sample jobs data
const jobs = [
  {
    id: 1,
    title: "Interior Painting - Office Building",
    location: "Dublin City Centre",
    timeline: "2 weeks",
    description: "Complete interior painting of a 3-floor office building including walls, ceilings, and trim work.",
    image: "/placeholder.svg?height=200&width=300",
    date: "2 days ago",
  },
  {
    id: 2,
    title: "Exterior Facade Restoration",
    location: "Galway",
    timeline: "3 weeks",
    description: "Restoration and painting of the exterior facade of a historic building in Galway city center.",
    image: "/placeholder.svg?height=200&width=300",
    date: "3 days ago",
  },
  {
    id: 3,
    title: "Commercial Space Repainting",
    location: "Cork",
    timeline: "1 week",
    description: "Repainting of a retail space including walls and ceiling. Requires work during off-hours.",
    image: "/placeholder.svg?height=200&width=300",
    date: "5 days ago",
  },
  {
    id: 4,
    title: "Residential Complex - Common Areas",
    location: "Limerick",
    timeline: "10 days",
    description: "Painting of common areas in a residential apartment complex including hallways and stairwells.",
    image: "/placeholder.svg?height=200&width=300",
    date: "1 week ago",
  },
  {
    id: 5,
    title: "New Construction - Apartment Building",
    location: "Waterford",
    timeline: "4 weeks",
    description: "Complete painting of a new 20-unit apartment building including all interior spaces.",
    image: "/placeholder.svg?height=200&width=300",
    date: "1 week ago",
  },
  {
    id: 6,
    title: "Hotel Renovation Project",
    location: "Kilkenny",
    timeline: "3 weeks",
    description: "Painting as part of a hotel renovation project including 40 rooms and common areas.",
    image: "/placeholder.svg?height=200&width=300",
    date: "2 weeks ago",
  },
]

export default function JobsPage() {
  return (
    <div className="container py-16 md:py-24">
      <div className="space-y-12 fade-in">
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold">Available Jobs</h1>
          <p className="text-muted-foreground max-w-3xl">
            Browse through our current job listings or post your own job to find professional painting services for your
            construction project.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search jobs..." className="pl-10" />
          </div>
          <Button asChild>
            <Link href="/post-job">Post a Job</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="group flex flex-col h-full bg-background border border-border rounded-lg overflow-hidden transition-all hover:shadow-md"
            >
              <div className="aspect-[3/2] overflow-hidden">
                <img
                  src={job.image || "/placeholder.svg"}
                  alt={job.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col flex-grow p-4">
                <h3 className="font-medium text-lg mb-2 group-hover:text-primary transition-colors">{job.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 flex-grow">{job.description}</p>
                <div className="text-sm text-muted-foreground mt-auto">
                  <div className="flex justify-between">
                    <span>{job.location}</span>
                    <span>{job.date}</span>
                  </div>
                  <div className="mt-1">
                    <span>Timeline: {job.timeline}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

