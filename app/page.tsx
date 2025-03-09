import Link from "next/link";
import { ArrowRight, Brush, Calendar, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackgroundPaths } from "@/components/BackgroundPaths";

// Sample data for featured jobs
const featuredJobs = [
  {
    id: "1",
    title: "Commercial Building Exterior",
    location: "New York, NY",
    timeline: "2-3 weeks",
    image: "/placeholder.svg?height=300&width=400",
  },
  {
    id: "2",
    title: "Residential Interior Painting",
    location: "Los Angeles, CA",
    timeline: "1-2 weeks",
    image: "/placeholder.svg?height=300&width=400",
  },
  {
    id: "3",
    title: "Office Space Renovation",
    location: "Chicago, IL",
    timeline: "3-4 weeks",
    image: "/placeholder.svg?height=300&width=400",
  },
  {
    id: "4",
    title: "Apartment Complex Hallways",
    location: "Miami, FL",
    timeline: "4-6 weeks",
    image: "/placeholder.svg?height=300&width=400",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-16 md:py-24 border-b border-border">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 fade-in">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                BuildXpert Professional Painting Services
              </h1>
              <p className="text-lg text-muted-foreground max-w-md">
                High-quality painting solutions for commercial and residential
                construction with a focus on precision and reliability.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" asChild>
                  <Link href="/post-job">Post a Job</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/services">Browse Services</Link>
                </Button>
              </div>
            </div>
            <div className="relative aspect-[4/3] fade-in rounded-lg overflow-hidden bg-white">
              <BackgroundPaths />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 border border-border rounded-lg fade-in">
              <div className="bg-secondary p-4 rounded-full mb-4">
                <Brush className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-medium mb-2">Expert Painting</h3>
              <p className="text-muted-foreground">
                Professional painting services for all types of construction
                projects with meticulous attention to detail.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 border border-border rounded-lg fade-in">
              <div className="bg-secondary p-4 rounded-full mb-4">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-medium mb-2">Flexible Scheduling</h3>
              <p className="text-muted-foreground">
                Book consultations and work dates that fit your timeline with
                our interactive scheduling system.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 border border-border rounded-lg fade-in">
              <div className="bg-secondary p-4 rounded-full mb-4">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-medium mb-2">Direct Communication</h3>
              <p className="text-muted-foreground">
                Stay connected with our team through integrated chat
                functionality for seamless project coordination.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="py-16 md:py-24 bg-secondary">
        <div className="container">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold">Featured Jobs</h2>
            <Button variant="outline" asChild>
              <Link href="/jobs" className="flex items-center gap-2">
                View All Jobs <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredJobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="group block bg-background border border-border rounded-lg overflow-hidden transition-all hover:shadow-md fade-in"
              >
                <div className="aspect-[3/2] overflow-hidden">
                  <img
                    src={job.image || "/placeholder.svg"}
                    alt={job.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium mb-2 group-hover:text-primary transition-colors">
                    {job.title}
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    <p>{job.location}</p>
                    <p>Timeline: {job.timeline}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6 fade-in">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Start Your Project?
            </h2>
            <p className="text-lg text-muted-foreground">
              Post your job details or browse our services to get started with
              your construction painting project.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Button size="lg" asChild>
                <Link href="/post-job">Post a Job</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
