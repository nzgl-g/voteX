
import { useState, useRef } from "react";
import { UploadIcon, FileIcon, XIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/shadcn-ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  accept?: string;
  maxSize?: number; // in bytes
  onFileChange: (file: File | null) => void;
  className?: string;
  label?: string;
  description?: string;
  error?: string;
}

export function FileUpload({
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB default
  onFileChange,
  className,
  label = "Upload file",
  description,
  error,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setFile(null);
      onFileChange(null);
      setFileError(null);
      return;
    }

    // Check file size
    if (file.size > maxSize) {
      setFileError(`File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`);
      return;
    }

    setFile(file);
    onFileChange(file);
    setFileError(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const removeFile = () => {
    handleFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={className}>
      {!file ? (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
            error && "border-destructive",
            className
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 font-semibold">{label}</h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          <p className="mt-2 text-sm text-muted-foreground">
            Drag and drop or click to browse
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileChange(e.target.files[0]);
              }
            }}
          />
        </div>
      ) : (
        <div className="flex items-center p-4 border rounded-lg">
          <FileIcon className="h-8 w-8 text-primary mr-3" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(2)} KB
            </p>
          </div>
          <div className="flex space-x-2">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={removeFile}>
              <XIcon className="h-5 w-5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <CheckIcon className="h-5 w-5 text-green-500" />
            </Button>
          </div>
        </div>
      )}
      {(fileError || error) && (
        <p className="mt-2 text-sm text-destructive">
          {fileError || error}
        </p>
      )}
    </div>
  );
}
