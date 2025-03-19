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
    <div className="w-full px-2 sm:px-4">
      <Carousel
        className="w-full max-w-5xl mx-auto"
        setApi={setApi}
        opts={{
          loop: true,
          align: "start",
        }}
      >
        <CarouselContent className="-ml-1 sm:-ml-2 md:-ml-4">
          {images.map((image, index) => (
            <CarouselItem
              key={index}
              className="pl-1 sm:pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
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
                      <DialogTrigger asChild>
                        <div
                          className="absolute inset-0 cursor-pointer"
                          onClick={() => setSelectedImage(image)}
                        >
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-secondary/80 backdrop-blur-sm p-2 rounded-md">
                              <Expand className="h-5 w-5" />
                            </div>
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-[100vw] max-h-[100vh] h-[100dvh] w-screen p-0 bg-black/90 border-0 [&>button]:hidden overflow-hidden">
                        <div
                          className="relative w-full h-full flex items-center justify-center"
                          onClick={nextImage}
                        >
                          <div className="relative w-full h-full max-w-[95vw] max-h-[85vh] md:max-h-[90vh] flex items-center justify-center">
                            <Image
                              src={selectedImage || image}
                              alt={`Painting project ${index + 1}`}
                              fill
                              sizes="(max-width: 768px) 95vw, 90vw"
                              className="object-contain"
                              priority
                              quality={90}
                            />
                          </div>
                          <DialogClose className="fixed top-4 right-4 sm:top-5 sm:right-5 md:top-6 md:right-6 z-[100]">
                            <div className="h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full bg-black/80 hover:bg-black/95 text-white flex items-center justify-center cursor-pointer shadow-lg transition-colors border border-white/20">
                              <X className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
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
        <div className="flex justify-center mt-4 sm:mt-6">
          <CarouselPrevious className="relative mr-2 h-8 w-8 sm:h-10 sm:w-10" />
          <CarouselNext className="relative ml-2 h-8 w-8 sm:h-10 sm:w-10" />
        </div>
      </Carousel>
    </div>
  );
}
