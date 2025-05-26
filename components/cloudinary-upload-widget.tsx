"use client";

import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "@/lib/toast";
import { cloudinaryConfig } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    cloudinary: any;
  }
}

interface CloudinaryUploadWidgetProps {
  onImageUploaded: (url: string) => void;
  className?: string;
}

export default function CloudinaryUploadWidget({
  onImageUploaded,
  className = "",
}: CloudinaryUploadWidgetProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const cloudinaryWidgetRef = useRef<any>(null);

  // Load Cloudinary script
  useEffect(() => {
    if (!isScriptLoaded && typeof window !== 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://upload-widget.cloudinary.com/global/all.js';
      script.async = true;
      script.onload = () => setIsScriptLoaded(true);
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }
  }, [isScriptLoaded]);

  // Initialize widget when script is loaded
  useEffect(() => {
    if (isScriptLoaded && typeof window !== 'undefined' && window.cloudinary) {
      cloudinaryWidgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloudName: cloudinaryConfig.cloudName,
          uploadPreset: cloudinaryConfig.uploadPreset,
          sources: ['local', 'url', 'camera'],
          multiple: false,
          maxFileSize: 5000000, // 5MB
          folder: 'session_banners',
          resourceType: 'image',
        },
        (error: any, result: any) => {
          if (!error && result && result.event === 'success') {
            const uploadedUrl = result.info.secure_url;
            onImageUploaded(uploadedUrl);
            toast.success('Image uploaded successfully');
          }
          
          if (result && result.event === 'close') {
            setIsUploading(false);
          }
          
          if (error) {
            console.error('Cloudinary upload error:', error);
            toast.error('Failed to upload image. Please try again.');
            setIsUploading(false);
          }
        }
      );
    }
  }, [isScriptLoaded, onImageUploaded]);

  const openWidget = () => {
    if (cloudinaryWidgetRef.current) {
      setIsUploading(true);
      cloudinaryWidgetRef.current.open();
    } else {
      toast.error('Upload widget is not available yet. Please try again in a moment.');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    openWidget();
  };

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
        dragActive
          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
          : "border-gray-300 hover:border-purple-400 dark:border-gray-600",
        isUploading && "opacity-50 cursor-not-allowed",
        className
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => !isUploading && openWidget()}
    >
      {isUploading ? (
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-sm">Uploading...</p>
        </div>
      ) : (
        <>
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Drag and drop an image, or click to select
          </p>
          <p className="text-xs text-gray-500 mt-1">JPG, PNG, or GIF, max 5MB</p>
        </>
      )}
    </div>
  );
} 