"use client";

import { useState } from "react";
import { X } from "lucide-react";
import CloudinaryUploadWidget from "@/components/cloudinary-upload-widget";

interface CloudinaryUploaderProps {
  onImageUploaded: (url: string) => void;
  previewUrl: string | null;
  onClear: () => void;
  className?: string;
}

export default function CloudinaryUploader({
  onImageUploaded,
  previewUrl,
  onClear,
  className = "",
}: CloudinaryUploaderProps) {
  return (
    <div className={className}>
      {previewUrl ? (
        <div className="relative mt-2 rounded-lg overflow-hidden shadow-md border border-gray-200">
          <div className="aspect-[16/9] w-full">
            <img src={previewUrl} alt="Banner preview" className="w-full h-full object-cover" />
          </div>
          <button
            onClick={onClear}
            className="absolute top-2 right-2 bg-black bg-opacity-60 text-white rounded-full p-1.5 hover:bg-opacity-80 transition-colors"
            aria-label="Remove banner image"
          >
            <X size={16} />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <p className="text-white text-sm font-medium">Current banner image</p>
          </div>
        </div>
      ) : (
        <CloudinaryUploadWidget onImageUploaded={onImageUploaded} />
      )}
    </div>
  );
} 