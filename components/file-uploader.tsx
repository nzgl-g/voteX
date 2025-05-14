import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "@/lib/toast";

interface FileUploaderProps {
  onFilesSelected: (files: FileList | null) => void;
  allowMultiple?: boolean;
  maxSizeMB?: number;
  accept?: string;
  className?: string;
}

export function FileUploader({
  onFilesSelected,
  allowMultiple = false,
  maxSizeMB = 10,
  accept = "*/*",
  className = "",
}: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate file size
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileSizeInMB = file.size / (1024 * 1024);
      if (fileSizeInMB > maxSizeMB) {
        toast({
          title: "File too large",
          description: `The file "${file.name}" is too large. Maximum allowed size is ${maxSizeMB}MB.`,
          variant: "destructive",
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
    }

    onFilesSelected(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    // If multiple files are not allowed, just take the first one
    if (!allowMultiple && files.length > 1) {
      const singleFile = new DataTransfer();
      singleFile.items.add(files[0]);
      onFilesSelected(singleFile.files);
      return;
    }
    
    // Validate file size
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileSizeInMB = file.size / (1024 * 1024);
      if (fileSizeInMB > maxSizeMB) {
        toast({
          title: "File too large",
          description: `The file "${file.name}" is too large. Maximum allowed size is ${maxSizeMB}MB.`,
          variant: "destructive",
        });
        return;
      }
    }
    
    onFilesSelected(files);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-md p-6 text-center ${
        isDragging ? "border-primary bg-primary/5" : "border-border"
      } ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        multiple={allowMultiple}
        accept={accept}
      />
      <div className="flex flex-col items-center justify-center space-y-2">
        <Upload className="h-8 w-8 text-muted-foreground" />
        <div className="text-sm">
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto font-normal"
            onClick={() => fileInputRef.current?.click()}
          >
            Click to upload
          </Button>{" "}
          or drag and drop
        </div>
        <p className="text-xs text-muted-foreground">
          {allowMultiple ? "Files" : "File"} up to {maxSizeMB}MB
          {accept !== "*/*" ? ` (${accept.replace(/\*/g, "")})` : ""}
        </p>
      </div>
    </div>
  );
} 