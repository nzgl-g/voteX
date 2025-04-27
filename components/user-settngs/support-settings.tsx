import { useState } from "react";
import { Button } from "@/components/shadcn-ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/shadcn-ui/alert-dialog";
import { Input } from "@/components/shadcn-ui/input";
import { Label } from "@/components/shadcn-ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/shadcn-ui/accordion";
import { HelpCircle, MessageCircle, AlertTriangle, Mail } from "lucide-react";

const faqs = [
    {
        question: "How do I change my profile picture?",
        answer: "You can change your profile picture by going to the Profile tab in Settings. Click on the camera icon below your current avatar and upload a new image."
    },
    {
        question: "How can I enable two-factor authentication?",
        answer: "Two-factor authentication can be enabled from the Security tab. Look for the '2FA' section and follow the instructions to set it up with your preferred authentication app."
    },
    {
        question: "Is my data backed up?",
        answer: "Yes, all your data is automatically backed up to our secure cloud servers in real-time. You don't need to do anything to ensure your data is safe."
    },
    {
        question: "How do I delete my account?",
        answer: "You can delete your account from the Support & More tab in Settings. Scroll down to the 'Danger Zone' section and click on 'Delete Account'. Please note that this action is irreversible."
    }
];

export function SupportSettings() {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [chatOpen, setChatOpen] = useState(false);
    const { toast } = useToast();

    const handleContactSupport = () => {
        toast({
            title: "Support request sent!",
            description: "Our team will get back to you within 24 hours.",
            duration: 3000,
        });
        setChatOpen(false);
    };

    const handleDeleteAccount = () => {
        if (confirmText === "DELETE") {
            toast({
                title: "Account scheduled for deletion",
                description: "Your account will be permanently deleted within 30 days.",
                duration: 5000,
            });
            setDeleteDialogOpen(false);
            setConfirmText("");
        } else {
            toast({
                title: "Confirmation failed",
                description: "Please type DELETE in all capitals to confirm.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-lg font-medium">Help & Support</h3>
                <p className="text-sm text-gray-500">
                    Get help with your account and manage account-related settings.
                </p>
            </div>

            <div className="space-y-6">
                <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-gray-500" />
                        Frequently Asked Questions
                    </h4>

                    <Accordion type="single" collapsible className="w-full">
                        {faqs.map((faq, index) => (
                            <AccordionItem key={index} value={`faq-${index}`}>
                                <AccordionTrigger className="text-left">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent>
                                    <p className="text-gray-600">{faq.answer}</p>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>

                <div className="space-y-4 border-t pt-6">
                    <h4 className="font-medium">Get Support</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                            variant="outline"
                            className="flex items-center justify-start gap-3 p-6 h-auto"
                            onClick={() => setChatOpen(true)}
                        >
                            <MessageCircle className="h-5 w-5 text-blue-500" />
                            <div className="text-left">
                                <div className="font-medium">Live Chat</div>
                                <div className="text-sm text-gray-500">Chat with our support team</div>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="flex items-center justify-start gap-3 p-6 h-auto"
                            onClick={() => {
                                toast({
                                    title: "Email support",
                                    description: "You can reach us at support@example.com",
                                });
                            }}
                        >
                            <Mail className="h-5 w-5 text-green-500" />
                            <div className="text-left">
                                <div className="font-medium">Email Support</div>
                                <div className="text-sm text-gray-500">Get help via email</div>
                            </div>
                        </Button>
                    </div>
                </div>

                <div className="border-t pt-6 mt-8">
                    <div className="space-y-4">
                        <h4 className="font-medium flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-4 w-4" />
                            Danger Zone
                        </h4>
                        <p className="text-sm text-gray-600">
                            Permanent actions that can't be undone. Please proceed with caution.
                        </p>

                        <Button
                            variant="destructive"
                            onClick={() => setDeleteDialogOpen(true)}
                            className="mt-2"
                        >
                            Delete Account
                        </Button>
                    </div>
                </div>
            </div>

            {/* Delete Account Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you really sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action is irreversible. Your account, data, and all associated information will be permanently deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="py-3">
                        <Label htmlFor="confirm-delete" className="text-sm font-medium">
                            Please type <span className="font-bold">DELETE</span> to confirm
                        </Label>
                        <Input
                            id="confirm-delete"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            className="mt-2"
                        />
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={(e) => {
                                e.preventDefault();
                                handleDeleteAccount();
                            }}
                        >
                            Delete Forever
                        </AlertDialogAction>
                    </AlertDialogFooter>

                    <div className="text-center text-sm text-gray-500 mt-2">
                        We'll miss you 😢... but we understand.
                    </div>
                </AlertDialogContent>
            </AlertDialog>

            {/* Live Chat Dialog */}
            <AlertDialog open={chatOpen} onOpenChange={setChatOpen}>
                <AlertDialogContent className="sm:max-w-[425px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Live Support Chat</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tell us how we can help you today.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="py-3 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="issue" className="text-sm font-medium">
                                What can we help you with?
                            </Label>
                            <Input
                                id="issue"
                                placeholder="Describe your issue..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="details" className="text-sm font-medium">
                                Additional details
                            </Label>
                            <Input
                                id="details"
                                placeholder="Any specific details we should know..."
                            />
                        </div>
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleContactSupport}>
                            Send Request
                        </AlertDialogAction>
                    </AlertDialogFooter>

                    <div className="text-center text-sm text-gray-500 mt-2">
                        We got you! 🚀
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
