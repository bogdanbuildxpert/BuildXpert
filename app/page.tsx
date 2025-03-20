import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Brush, Calendar, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackgroundPaths } from "@/components/BackgroundPaths";
import fs from "fs";
import path from "path";
import PaintingJobsCarousel from "@/components/PaintingJobsCarousel";
import Script from "next/script";

// Add specific metadata for home page
export const metadata: Metadata = {
  title: "BuildXpert - Professional Painting Services in Ireland",
  description:
    "High-quality painting solutions for commercial and residential construction with a focus on precision, reliability, and customer satisfaction.",
  alternates: {
    canonical: "https://buildxpert.ie",
  },
};

// Function to get all painting job images
function getPaintingJobImages() {
  const directory = path.join(process.cwd(), "public", "PaintingJobs");
  const fileNames = fs.readdirSync(directory);

  // Filter for image files (jpg, jpeg, png)
  const imageFiles = fileNames.filter((file) =>
    /\.(jpg|jpeg|png)$/i.test(file)
  );

  // Map to image paths
  return imageFiles.map((fileName) => `/PaintingJobs/${fileName}`);
}

export default function Home() {
  // Get all painting job images
  const paintingJobImages = getPaintingJobImages();

  return (
    <>
      {/* JSON-LD structured data for SEO */}
      <Script
        id="homepage-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HomeAndConstructionBusiness",
            name: "BuildXpert",
            description:
              "High-quality painting solutions for commercial and residential construction with a focus on precision and reliability.",
            url: "https://buildxpert.ie",
            logo: "https://buildxpert.ie/favicon.svg",
            image: "https://buildxpert.ie/og-image.jpg",
            telephone: "+353 1 234 5678",
            email: "info@buildxpert.ie",
            address: {
              "@type": "PostalAddress",
              streetAddress: "123 Main Street",
              addressLocality: "Dublin",
              addressRegion: "Dublin",
              postalCode: "D01 ABC1",
              addressCountry: "IE",
            },
            priceRange: "€€",
            sameAs: [
              "https://facebook.com/buildxpert",
              "https://twitter.com/buildxpert",
              "https://instagram.com/buildxpert",
            ],
            openingHoursSpecification: [
              {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                ],
                opens: "09:00",
                closes: "17:00",
              },
            ],
            serviceArea: {
              "@type": "GeoCircle",
              geoMidpoint: {
                "@type": "GeoCoordinates",
                latitude: 53.349805,
                longitude: -6.26031,
              },
              geoRadius: "50000",
            },
            hasOfferCatalog: {
              "@type": "OfferCatalog",
              name: "Painting Services",
              itemListElement: [
                {
                  "@type": "Offer",
                  itemOffered: {
                    "@type": "Service",
                    name: "Interior Painting",
                  },
                },
                {
                  "@type": "Offer",
                  itemOffered: {
                    "@type": "Service",
                    name: "Exterior Painting",
                  },
                },
                {
                  "@type": "Offer",
                  itemOffered: {
                    "@type": "Service",
                    name: "Commercial Painting",
                  },
                },
              ],
            },
          }),
        }}
      />

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
        <section className="py-16 md:py-24 bg-muted">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-12">
              Our Services
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6 border border-border rounded-lg fade-in bg-card">
                <div className="bg-secondary p-4 rounded-full mb-4">
                  <Brush className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-medium mb-2">Expert Painting</h3>
                <p className="text-muted-foreground">
                  Professional painting services for all types of construction
                  projects with meticulous attention to detail.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 border border-border rounded-lg fade-in bg-card">
                <div className="bg-secondary p-4 rounded-full mb-4">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-medium mb-2">
                  Flexible Scheduling
                </h3>
                <p className="text-muted-foreground">
                  Book consultations and work dates that fit your timeline with
                  our interactive scheduling system.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 border border-border rounded-lg fade-in bg-card">
                <div className="bg-secondary p-4 rounded-full mb-4">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-medium mb-2">
                  Direct Communication
                </h3>
                <p className="text-muted-foreground">
                  Stay connected with our team through email updates and phone
                  support for seamless project coordination.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Getting a quote and booking your painting job is simple and
                straightforward with BuildXpert.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow fade-in">
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
                      1
                    </div>
                  </div>
                  <h3 className="text-xl font-medium text-center">
                    Post Your Job
                  </h3>
                  <p className="text-muted-foreground text-center">
                    Fill out our simple job posting form with details about your
                    painting project.
                  </p>
                </div>
              </div>
              <div className="bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow fade-in">
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
                      2
                    </div>
                  </div>
                  <h3 className="text-xl font-medium text-center">
                    Get a Quote
                  </h3>
                  <p className="text-muted-foreground text-center">
                    Our team of professional painters will assess your job and
                    provide detailed quotes quickly, ensuring top-quality
                    service.
                  </p>
                </div>
              </div>
              <div className="bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow fade-in">
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
                      3
                    </div>
                  </div>
                  <h3 className="text-xl font-medium text-center">
                    Schedule Your Service
                  </h3>
                  <p className="text-muted-foreground text-center">
                    Choose the best quote, communicate with your painter, and
                    schedule your project.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-12 text-center">
              <Button size="lg" asChild>
                <Link href="/post-job">Get Started Now</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Painting Jobs Showcase Section */}
        <section className="py-16 md:py-24 bg-muted">
          <div className="container">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-3xl font-bold">Our Recent Projects</h2>
              <Button variant="outline" asChild>
                <Link href="/services" className="flex items-center gap-2">
                  View All Services <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="space-y-8">
              <p className="text-muted-foreground max-w-3xl">
                Browse through our gallery of recently completed painting
                projects. These images showcase our quality workmanship and
                attention to detail.
              </p>
              <PaintingJobsCarousel images={paintingJobImages} />
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
    </>
  );
}
