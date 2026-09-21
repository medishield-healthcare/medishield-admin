"use client";
import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";

interface ImageCarouselProps {
  images: string[];
}

export function ImageCarousel({ images }: ImageCarouselProps) {
  console.log(images);
  return (
    <Carousel className="product-gallery">
      <CarouselContent>
        {Array.from({ length: images.length }).map((_, index) => (
          <CarouselItem key={index}>
            <div className="p-1">
              <Card className="border-0 bg-muted shadow-none">
                <CardContent className="flex aspect-square items-center justify-center p-5">
                  <img
                    alt={`Product image ${index + 1}`}
                    className="max-h-full w-full object-contain"
                    loading="lazy"
                    width={400}
                    height={400}
                    src={
                      images[index].startsWith("http")
                        ? images[index]
                        : "https://images1.dentalkart.com/media/catalog/product" +
                          images[index]
                    }
                  />
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-0" />
      <CarouselNext className="right-0" />
    </Carousel>
  );
}
