import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarIcon, Upload } from 'lucide-react';
import { candidateService } from '@/services/candidate-service';

interface CandidateFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sessionId: string;
    sessionTitle: string;
}

interface FormData {
    dateOfBirth: Date | undefined;
    placeOfBirth: string;
    nationalities: string;
    promises: string;
    biography: string;
    experience: string;
    partyName: string;
    officialPaper: File | null;
}

// Maximum file size in bytes (2MB)
const MAX_FILE_SIZE = 2 * 1024 * 1024;

const CandidateFormDialog: React.FC<CandidateFormDialogProps> = ({
    open,
    onOpenChange,
    sessionId,
    sessionTitle
}) => {
    const [formData, setFormData] = useState<FormData>({
        dateOfBirth: undefined,
        placeOfBirth: '',
        nationalities: '',
        promises: '',
        biography: '',
        experience: '',
        partyName: '',
        officialPaper: null,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (date: Date | undefined) => {
        setFormData((prev) => ({ ...prev, dateOfBirth: date }));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Check file size (2MB limit)
            if (file.size > MAX_FILE_SIZE) {
                toast.error(`File size exceeds 2MB limit. Please choose a smaller file.`);
                return;
            }
            
            setFormData(prev => ({
                ...prev,
                officialPaper: file
            }));
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            
            // Check file size (2MB limit)
            if (file.size > MAX_FILE_SIZE) {
                toast.error(`File size exceeds 2MB limit. Please choose a smaller file.`);
                return;
            }
            
            setFormData(prev => ({
                ...prev,
                officialPaper: file
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (!formData.dateOfBirth) {
                toast.error("Please select your date of birth");
                setIsSubmitting(false);
                return;
            }

            // Create application data with just the required fields
            const applicationData: any = {
                biography: formData.biography,
                experience: formData.experience,
                nationalities: formData.nationalities.split(',').map(n => n.trim()),
                dobPob: {
                    dateOfBirth: formData.dateOfBirth ? format(formData.dateOfBirth, 'yyyy-MM-dd') : '',
                    placeOfBirth: formData.placeOfBirth
                },
                promises: formData.promises.split('\n').map(p => p.trim()).filter(p => p),
                partyName: formData.partyName
            };

            // If there's a file, include the filename as paper for now
            if (formData.officialPaper) {
                // Just store the filename as a placeholder
                applicationData.paper = `file:${formData.officialPaper.name}`;
            }

            // Submit the application
            const response = await candidateService.applyAsCandidate(sessionId, applicationData);

            // Show success notification
            toast.success("Candidate registration submitted successfully!", {
                description: response.message || `You have registered as a candidate for ${sessionTitle}`,
            });

            // Close dialog
            onOpenChange(false);
        } catch (error: any) {
            // Handle 413 Payload Too Large error specifically
            if (error.message.includes('413') || error.message.includes('Payload Too Large')) {
                toast.error("File too large", {
                    description: "The uploaded file exceeds the server's size limit. Try simplifying your form data."
                });
            }
            // Handle specific error cases
            else if (error.message.includes("already a candidate") || 
                error.message.includes("already applied") ||
                error.message.includes("application is still pending") ||
                error.message.includes("previous request was rejected")) {
                toast.error(error.message);
            } else {
                toast.error("Failed to submit registration", {
                    description: error.message || "Please try again later or contact support.",
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">Register as a Candidate</DialogTitle>
                    <DialogDescription>
                        Complete this form to register as a candidate for "{sessionTitle}"
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="dateOfBirth">Date of Birth <span className="text-red-500">*</span></Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="dateOfBirth"
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !formData.dateOfBirth && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.dateOfBirth ? format(formData.dateOfBirth, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={formData.dateOfBirth}
                                        onSelect={handleDateChange}
                                        disabled={(date) =>
                                            date > new Date() || date < new Date("1900-01-01")
                                        }
                                        initialFocus
                                        className="p-3 pointer-events-auto"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="placeOfBirth">Place of Birth <span className="text-red-500">*</span></Label>
                            <Input
                                id="placeOfBirth"
                                name="placeOfBirth"
                                value={formData.placeOfBirth}
                                onChange={handleInputChange}
                                placeholder="City, Country"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="nationalities">Nationalities <span className="text-red-500">*</span></Label>
                        <Input
                            id="nationalities"
                            name="nationalities"
                            value={formData.nationalities}
                            onChange={handleInputChange}
                            placeholder="Enter your nationality/nationalities (comma separated)"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="promises">Campaign Promises <span className="text-red-500">*</span></Label>
                        <Textarea
                            id="promises"
                            name="promises"
                            value={formData.promises}
                            onChange={handleInputChange}
                            placeholder="Describe your key promises and goals if elected (one per line)"
                            required
                            className="h-24"
                        />
                        <p className="text-xs text-muted-foreground">Enter each promise on a new line</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="biography">Biography <span className="text-red-500">*</span></Label>
                            <Textarea
                                id="biography"
                                name="biography"
                                value={formData.biography}
                                onChange={handleInputChange}
                                placeholder="Tell us about yourself"
                                required
                                className="h-24"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="experience">Experience <span className="text-red-500">*</span></Label>
                            <Textarea
                                id="experience"
                                name="experience"
                                value={formData.experience}
                                onChange={handleInputChange}
                                placeholder="Describe your relevant experience"
                                required
                                className="h-24"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="partyName">Party Name <span className="text-red-500">*</span></Label>
                        <Input
                            id="partyName"
                            name="partyName"
                            value={formData.partyName}
                            onChange={handleInputChange}
                            placeholder="Enter your party name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="officialPaper">Upload Official Papers <span className="text-red-500">*</span></Label>
                        <div
                            className={cn(
                                "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20",
                                formData.officialPaper ? "bg-primary/5" : ""
                            )}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('file-upload')?.click()}
                        >
                            <input
                                id="file-upload"
                                type="file"
                                className="hidden"
                                onChange={handleFileChange}
                                accept=".pdf,.jpg,.jpeg,.png"
                                required={!formData.officialPaper}
                            />
                            <div className="flex flex-col items-center justify-center gap-2">
                                <Upload className="h-8 w-8 text-muted-foreground" />
                                {formData.officialPaper ? (
                                    <p className="text-sm font-medium">{formData.officialPaper.name}</p>
                                ) : (
                                    <>
                                        <p className="text-sm font-medium">Drag and drop your file here or click to browse</p>
                                        <p className="text-xs text-muted-foreground">PDF, JPG, PNG (Max. 2MB)</p>
                                    </>
                                )}
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Note: Files are currently processed as placeholders. Full file upload will be implemented in a future update.
                        </p>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-vote-nominations hover:bg-vote-nominations/80"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Submitting..." : "Submit Application"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CandidateFormDialog;