"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/shadcn-ui/dialog";
import { Button } from "@/components/shadcn-ui/button";
import { Input } from "@/components/shadcn-ui/input";
import { Textarea } from "@/components/shadcn-ui/textarea";
import { Label } from "@/components/shadcn-ui/label";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/shadcn-ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { candidateService, CandidateApplicationData } from "@/api/candidate-service";

// Define form schema
const candidateFormSchema = z.object({
    fullName: z.string().min(2, "Full name is required"),
    biography: z.string().min(10, "Biography must be at least 10 characters long"),
    experience: z.string().min(10, "Experience must be at least 10 characters long"),
    nationalities: z.string().min(2, "Nationality is required"),
    dobPob: z.string().min(2, "Date and place of birth are required"),
    promises: z.string().min(10, "Promises must be at least 10 characters long"),
    partyName: z.string().min(2, "Party name is required"),
    officialPaper: z.instanceof(File).optional(),
});

type CandidateFormValues = z.infer<typeof candidateFormSchema>;

interface CandidateNominationFormProps {
    sessionId: string;
    onSubmit?: (data: CandidateFormValues) => void;
    onClose?: () => void;
    trigger?: React.ReactNode;
}

interface Paper {
    name: string;
    url: string;
}

export function CandidateNominationForm({ sessionId, onSubmit, onClose, trigger }: CandidateNominationFormProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [officialPaper, setOfficialPaper] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Open the dialog when sessionId changes
    useEffect(() => {
        if (sessionId) {
            setOpen(true);
        }
    }, [sessionId]);

    // Handle dialog close
    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen && onClose) {
            onClose();
        }
    };

    const form = useForm<CandidateFormValues>({
        resolver: zodResolver(candidateFormSchema),
        defaultValues: {
            fullName: "",
            biography: "",
            experience: "",
            nationalities: "",
            dobPob: "",
            promises: "",
            partyName: "",
        }
    });

    const handleFileUpload = async (file: File): Promise<string> => {
        // This is a placeholder for a real file upload function
        // In a real application, you would upload to a server or cloud storage
        return new Promise((resolve) => {
            // Simulate upload progress
            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                setUploadProgress(progress);

                if (progress >= 100) {
                    clearInterval(interval);
                    // Return a mock URL or the result from your server
                    resolve(`https://storage.example.com/documents/${Date.now()}-${file.name}`);
                }
            }, 300);
        });
    };

    const handleSubmit = async (values: CandidateFormValues) => {
        setIsSubmitting(true);
        setUploadProgress(0);

        try {
            // Debug sessionId to ensure it's valid
            console.log("SessionId type:", typeof sessionId);
            console.log("SessionId value:", sessionId);
            
            if (!sessionId || sessionId === 'undefined' || sessionId === 'null') {
                throw new Error("Invalid session ID. Please try again or contact support.");
            }

            console.log("Preparing to submit nomination for session:", sessionId);

            // Skip file upload for now to test basic submission
            let papers: Paper[] = [];

            // Only handle papers if the file was uploaded
            if (officialPaper) {
                try {
                    // In a real app, we would implement actual file upload here
                    // For now, we'll create a mock URL
                    const paperUrl = `https://example.com/documents/${Date.now()}-${officialPaper.name}`;
                    console.log("Paper URL created:", paperUrl);

                    papers = [{
                        name: officialPaper.name,
                        url: paperUrl
                    }];
                } catch (error) {
                    console.error("Error with file:", error);
                    toast.error("File processing failed, but continuing with submission");
                }
            }

            // Parse the form values into the expected format for the server
            // Note: The server will get the fullName from the user profile
            const applicationData: CandidateApplicationData = {
                fullName: values.fullName, // This may be unused by the server, but we include it for completeness
                biography: values.biography || '',
                experience: values.experience || '',
                nationalities: values.nationalities || '',
                dobPob: values.dobPob || '',
                promises: values.promises || '',
                partyName: values.partyName || '',
                // Make papers truly optional - don't include it in the request if empty
                ...(papers.length > 0 ? { papers } : {})
            };

            console.log("Submitting application data:", applicationData);

            // Submit to the candidate service and get result
            try {
                const result = await candidateService.applyAsCandidate(sessionId, applicationData);
                console.log("Submission result:", result);
                
                // Success case
                setOpen(false);
                form.reset();
                setOfficialPaper(null);
                toast.success(result.message || "Your nomination has been submitted successfully");
                
                // Optional callback for parent component to handle the result
                if (onSubmit) {
                    onSubmit({
                        ...values,
                        officialPaper: officialPaper || undefined,
                    });
                }
                
                // Call onClose callback if provided
                if (onClose) {
                    onClose();
                }
            } catch (error: any) {
                // Handle the case where it's already submitted (which is actually a success from user perspective)
                if (error.message && error.message.includes("pending application")) {
                    setOpen(false);
                    form.reset();
                    setOfficialPaper(null);
                    toast.info("Your application was already submitted and is currently under review.");
                    
                    if (onClose) {
                        onClose();
                    }
                } else {
                    // Real error
                    throw error;
                }
            }
        } catch (error: any) {
            console.error("Error submitting nomination:", error);
            // Use the error message from the response if available
            const errorMessage = error.message || "Failed to submit nomination. Please try again.";
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
            setUploadProgress(0);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File is too large. Maximum size is 5MB.");
                return;
            }

            // Validate file type
            const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            if (!validTypes.includes(file.type)) {
                toast.error("Invalid file type. Please upload a PDF or image file.");
                return;
            }

            setOfficialPaper(file);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Candidate Nomination Form</DialogTitle>
                    <DialogDescription>
                        Fill in your details to nominate yourself as a candidate for this election.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">
                        <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="biography"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Biography</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Tell us about yourself"
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="experience"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Experience</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describe your relevant experience"
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="nationalities"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nationalities</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. American, French" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="dobPob"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date & Place of Birth</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Jan 1, 1990 - New York" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="promises"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Promises</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="What do you promise to accomplish if elected?"
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="partyName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Party Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Your party or affiliation" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-2">
                            <Label htmlFor="officialPaper">Official Paper (Optional)</Label>
                            <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center">
                                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground mb-2">
                                    Drag and drop your official document, or click to browse
                                </p>
                                <p className="text-xs text-muted-foreground mb-4">Accepted formats: PDF, JPG, PNG. Max file size: 5MB</p>
                                <div className="relative">
                                    <Input
                                        id="officialPaper"
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleFileChange}
                                    />
                                    <Button type="button" variant="outline">Select File</Button>
                                </div>
                                {officialPaper && (
                                    <p className="mt-2 text-sm">Selected: {officialPaper.name}</p>
                                )}

                                {uploadProgress > 0 && uploadProgress < 100 && (
                                    <div className="w-full mt-4">
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-center mt-1">{uploadProgress}% uploaded</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Submitting..." : "Submit Nomination"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}