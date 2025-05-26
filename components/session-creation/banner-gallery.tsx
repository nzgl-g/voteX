"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

interface BannerGalleryProps {
  banners: string[];
  selectedBanner: string | null;
  onSelect: (url: string) => void;
}

export default function BannerGallery({ banners, selectedBanner, onSelect }: BannerGalleryProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <p className="text-sm font-medium mb-3">Or choose from our gallery:</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {banners.map((banner, index) => (
          <div
            key={index}
            className={cn(
              "cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-300 relative group",
              selectedBanner === banner
                ? "border-purple-500 ring-2 ring-purple-300 shadow-md"
                : "border-transparent hover:border-purple-300 hover:shadow-md",
            )}
            onClick={() => onSelect(banner)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="relative aspect-[16/9] w-full">
              <img
                src={banner}
                alt={`Voting session banner ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {hoveredIndex === index && (
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center transition-opacity duration-300">
                  <span className="text-white text-sm font-medium px-3 py-1 bg-purple-600 bg-opacity-80 rounded-full">
                    Select
                  </span>
                </div>
              )}
              {selectedBanner === banner && (
                <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                  Selected
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-2">Click on a banner to select it for your voting session</p>
    </div>
  );
} 