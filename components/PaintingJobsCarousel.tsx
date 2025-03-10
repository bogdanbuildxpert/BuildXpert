"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Expand, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

interface PaintingJobsCarouselProps {
  images: string[];
}

export default function PaintingJobsCarousel({
  images,
}: PaintingJobsCarouselProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [api, setApi] = useState<CarouselApi>();
  const currentIndex = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const nextImage = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    currentIndex.current = (currentIndex.current + 1) % images.length;
    setSelectedImage(images[currentIndex.current]);
    api?.scrollNext();
    timerRef.current = setInterval(() => {
      currentIndex.current = (currentIndex.current + 1) % images.length;
      setSelectedImage(images[currentIndex.current]);
      api?.scrollNext();
    }, 5000);
  };

  useEffect(() => {
    if (!api) return;

    timerRef.current = setInterval(nextImage, 5000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [api, images]);

  return (
    <div className="w-full px-4">
      <Carousel
        className="w-full max-w-5xl mx-auto"
        setApi={setApi}
        opts={{
          loop: true,
          align: "start",
        }}
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {images.map((image, index) => (
            <CarouselItem
              key={index}
              className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3"
            >
              <div className="h-full">
                <Card className="border-0 overflow-hidden h-full">
                  <CardContent className="p-0 relative group aspect-[4/3]">
                    <div className="absolute inset-0">
                      <Image
                        src={image}
                        alt={`Painting project ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        priority={index === 0}
                      />
                    </div>
                    <Dialog>
                      <DialogTrigger>
                        <div
                          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-md bg-secondary/80 backdrop-blur-sm p-2 cursor-pointer hover:bg-secondary"
                          onClick={() => setSelectedImage(image)}
                        >
                          <Expand className="h-4 w-4" />
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-transparent border-0 [&>button]:hidden">
                        <div
                          className="relative w-full h-full"
                          onClick={nextImage}
                        >
                          <div className="relative aspect-[16/9] w-full">
                            <Image
                              src={selectedImage || image}
                              alt={`Painting project ${index + 1}`}
                              fill
                              sizes="90vw"
                              className="object-contain rounded-lg"
                              priority
                            />
                          </div>
                          <DialogClose className="absolute top-4 right-4 z-50">
                            <div className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background flex items-center justify-center cursor-pointer">
                              <X className="h-4 w-4" />
                              <span className="sr-only">Close</span>
                            </div>
                          </DialogClose>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="flex justify-center mt-6">
          <CarouselPrevious className="relative mr-2" />
          <CarouselNext className="relative ml-2" />
        </div>
      </Carousel>
    </div>
  );
}
