import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileUploader } from "@/components/file-uploader";
import { toast } from "@/lib/toast";
import { Loader2 } from "lucide-react";
import kycService from "@/services/kyc-service";

interface KYCVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void;
  userData?: {
    fullName?: string;
    dateOfBirth?: string;
    nationalities?: string[];
    placeOfBirth?: string;
  };
}

export function KYCVerificationDialog({
  open,
  onOpenChange,
  onVerified,
  userData = {},
}: KYCVerificationDialogProps) {
  const [idNumber, setIdNumber] = useState("");
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      setIdCardFile(files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!idNumber) {
      toast({
        title: "Missing Information",
        description: "Please enter your ID card number",
        variant: "destructive",
      });
      return;
    }

    if (!idCardFile) {
      toast({
        title: "Missing Information",
        description: "Please upload a copy of your ID card",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Submit KYC verification
      const result = await kycService.submitVerification({
        idNumber,
        idCardFile
      });
      
      if (result.success) {
        toast({
          title: "Verification Successful",
          description: result.message || "Your identity has been verified successfully",
        });
        
        onVerified();
        onOpenChange(false);
      } else {
        toast({
          title: "Verification Failed",
          description: result.message || "Unable to verify your identity. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("KYC verification failed:", error);
      toast({
        title: "Verification Failed",
        description: "Unable to verify your identity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Identity Verification Required</DialogTitle>
          <DialogDescription>
            This voting session requires identity verification. Please complete the information below.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Your Information</h3>
            <div className="bg-muted/50 p-3 rounded-md space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Full Name</Label>
                  <p className="text-sm font-medium">{userData.fullName || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Date of Birth</Label>
                  <p className="text-sm font-medium">
                    {userData.dateOfBirth 
                      ? new Date(userData.dateOfBirth).toLocaleDateString() 
                      : "Not provided"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Place of Birth</Label>
                  <p className="text-sm font-medium">{userData.placeOfBirth || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Nationalities</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {userData.nationalities && userData.nationalities.length > 0 ? (
                      userData.nationalities.map((nationality, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {nationality}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm">Not provided</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="id-number" className="text-sm font-medium">
              ID Card Number
            </Label>
            <Input
              id="id-number"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder="Enter your ID card number"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Upload ID Card Image
            </Label>
            <FileUploader
              allowMultiple={false}
              onFilesSelected={handleFileChange}
              accept="image/*"
              maxSizeMB={5}
            />
            {idCardFile && (
              <p className="text-xs text-muted-foreground mt-1">
                Selected file: {idCardFile.name} ({Math.round(idCardFile.size / 1024)} KB)
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Identity"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 