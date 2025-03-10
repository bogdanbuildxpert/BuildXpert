import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import fs from "fs";
import path from "path";
import PaintingJobsCarousel from "@/components/PaintingJobsCarousel";

// Sample services data
const services = [
  {
    id: 1,
    title: "Interior Painting",
    description:
      "Professional interior painting services for commercial and residential properties including walls, ceilings, trim, and more.",
    image: "/images/_cf3d8457-235b-424d-8aa1-8dbe50df55cc.jpeg",
  },
  {
    id: 2,
    title: "Exterior Painting",
    description:
      "High-quality exterior painting services for buildings, facades, and structures with weather-resistant finishes.",
    image: "/images/_6ac5a96b-4829-4d2e-9b99-965b76dd4654.jpeg",
  },
  {
    id: 3,
    title: "Commercial Painting",
    description:
      "Specialized painting services for commercial properties including offices, retail spaces, hotels, and more.",
    image: "/images/_ca719f50-8cc4-4e59-a69d-5c9ead6833e0.jpeg",
  },
  {
    id: 4,
    title: "Residential Painting",
    description:
      "Complete painting solutions for residential properties including houses, apartments, and multi-unit buildings.",
    image: "/images/_50a72594-7420-4b8f-a653-225b4d44bc52.jpeg",
  },
  {
    id: 5,
    title: "Specialty Finishes",
    description:
      "Custom specialty finishes including textured paints, faux finishes, decorative techniques, and more.",
    image: "/images/_882ab424-832c-4120-b299-4f2a2078e746.jpeg",
  },
  {
    id: 6,
    title: "Surface Preparation",
    description:
      "Comprehensive surface preparation services including cleaning, sanding, patching, and priming for optimal paint adhesion.",
    image: "/images/_11c61720-faec-4c60-b554-bf219ca64c23.jpeg",
  },
];

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

export default function ServicesPage() {
  return (
    <div className="container py-16 md:py-24">
      <div className="space-y-12 fade-in">
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold">Our Services</h1>
          <p className="text-muted-foreground">
            We offer a comprehensive range of professional painting services for
            construction projects of all sizes. Our team of experienced painters
            delivers high-quality results with attention to detail and
            commitment to excellence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div
              key={service.id}
              className="group border border-border rounded-lg overflow-hidden flex flex-col h-full"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <Image
                  src={service.image}
                  alt={service.title}
                  width={400}
                  height={300}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-medium mb-2">{service.title}</h3>
                <p className="text-muted-foreground mb-4 flex-grow">
                  {service.description}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit mt-auto"
                  asChild
                >
                  <Link href="/contact" className="flex items-center gap-2">
                    Request Quote <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-secondary p-8 md:p-12 rounded-lg">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold">
              Need a Custom Service?
            </h2>
            <p className="text-muted-foreground">
              We understand that every project is unique. Contact us to discuss
              your specific requirements and get a customized solution for your
              painting needs.
            </p>
            <Button size="lg" asChild>
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
