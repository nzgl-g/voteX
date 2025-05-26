import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, MessageCircle, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
        question: "How do I update my personal information?",
        answer: "You can update your personal information from the Profile tab in Settings. Click the edit button next to any field you wish to change."
    }
];

export function SupportSettings() {
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

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-lg font-medium">Help & Support</h3>
                <p className="text-sm text-muted-foreground">
                    Get help with your account and find answers to common questions.
                </p>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <HelpCircle className="h-4 w-4 text-primary" />
                            Frequently Asked Questions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            {faqs.map((faq, index) => (
                                <AccordionItem key={index} value={`faq-${index}`}>
                                    <AccordionTrigger className="text-left">
                                        {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-muted-foreground">{faq.answer}</p>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Get Support</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Button
                                variant="outline"
                                className="flex items-center justify-start gap-3 p-6 h-auto"
                                onClick={() => setChatOpen(true)}
                            >
                                <MessageCircle className="h-5 w-5 text-blue-500" />
                                <div className="text-left">
                                    <div className="font-medium">Live Chat</div>
                                    <div className="text-sm text-muted-foreground">Chat with our support team</div>
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
                                    <div className="text-sm text-muted-foreground">Get help via email</div>
                                </div>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

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
