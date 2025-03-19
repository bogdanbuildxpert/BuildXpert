import fs from "fs";
import path from "path";
import Image from "next/image";
import PaintingJobsCarousel from "@/components/PaintingJobsCarousel";

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

export default function AboutPage() {
  // Get all painting job images
  const paintingJobImages = getPaintingJobImages();

  return (
    <div className="container py-16 md:py-24">
      <div className="space-y-16 fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-3xl md:text-4xl font-bold">About BuildXpert</h1>
            <p className="text-muted-foreground">
              We are a professional painting company specializing in
              high-quality painting services for construction projects. With
              years of experience in the industry, we have built a reputation
              for excellence, reliability, and attention to detail.
            </p>
            <p className="text-muted-foreground">
              Our team of skilled painters is committed to delivering
              exceptional results for every project, whether it&apos;s a small
              residential job or a large commercial undertaking. We take pride
              in our work and strive to exceed our clients&apos; expectations.
            </p>
          </div>
          <div className="relative flex justify-center">
            <Image
              src="/images/AppImages/ContactUs.webp"
              alt="Our team at BuildXpert"
              className="rounded-lg shadow-md"
              width={500}
              height={450}
              style={{
                maxHeight: "450px",
                maxWidth: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        </div>

        {/* Painting Jobs Showcase */}
        <div className="space-y-8">
          <div className="space-y-4 max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-bold">
              Our Recent Painting Projects
            </h2>
            <p className="text-muted-foreground">
              Browse through our gallery of recently completed painting
              projects. These images showcase our quality workmanship and
              attention to detail.
            </p>
          </div>

          <PaintingJobsCarousel images={paintingJobImages} />
        </div>

        <div className="space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center">
            Our Approach
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border border-border rounded-lg p-6 space-y-4">
              <h3 className="text-xl font-medium">Quality</h3>
              <p className="text-muted-foreground">
                We use only premium materials and employ proven techniques to
                ensure long-lasting, beautiful results for every project we
                undertake.
              </p>
            </div>
            <div className="border border-border rounded-lg p-6 space-y-4">
              <h3 className="text-xl font-medium">Reliability</h3>
              <p className="text-muted-foreground">
                We understand the importance of timelines in construction
                projects and are committed to completing our work on schedule
                and within budget.
              </p>
            </div>
            <div className="border border-border rounded-lg p-6 space-y-4">
              <h3 className="text-xl font-medium">Expertise</h3>
              <p className="text-muted-foreground">
                Our team brings years of experience and specialized knowledge to
                every project, ensuring optimal results for various surfaces and
                environments.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center">
            Our Journey
          </h2>
          <div className="relative border-l border-border pl-8 ml-4 space-y-12">
            <div className="relative">
              <div className="absolute -left-12 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-medium">
                  1
                </span>
              </div>
              <h3 className="text-xl font-medium">Founding</h3>
              <p className="text-muted-foreground mt-2">
                Established with a vision to provide exceptional painting
                services for construction projects, focusing on quality and
                customer satisfaction.
              </p>
            </div>
            <div className="relative">
              <div className="absolute -left-12 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-medium">
                  2
                </span>
              </div>
              <h3 className="text-xl font-medium">Growth</h3>
              <p className="text-muted-foreground mt-2">
                Expanded our team and services to meet growing demand, while
                maintaining our commitment to excellence and personalized
                attention.
              </p>
            </div>
            <div className="relative">
              <div className="absolute -left-12 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-medium">
                  3
                </span>
              </div>
              <h3 className="text-xl font-medium">Today</h3>
              <p className="text-muted-foreground mt-2">
                Now recognized as a leading painting service provider for
                construction projects, with a portfolio of successful projects
                and satisfied clients.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-secondary p-8 md:p-12 rounded-lg text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold">
            Ready to Work With Us?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Whether you&apos;re planning a new construction project or
            renovating an existing space, we&apos;re here to help with your
            painting needs. Contact us today to discuss your project.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <a
              href="/contact"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 py-2"
            >
              Contact Us
            </a>
            <a
              href="/services"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-accent hover:text-accent-foreground h-11 px-8 py-2"
            >
              Our Services
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
