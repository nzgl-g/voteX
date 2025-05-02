import { useState } from "react";
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
import { toast } from "sonner";
import { sessionService } from "@/api/session-service";

interface SecretPhraseDialogProps {
    onPhraseConfirmed: (phrase: string) => void;
}

export function SecretPhraseDialog({ onPhraseConfirmed }: SecretPhraseDialogProps) {
    const [phrase, setPhrase] = useState("");
    const [open, setOpen] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phrase.trim()) {
            toast.error("Please enter a secret phrase");
            return;
        }

        setIsChecking(true);
        try {
            // Check if the phrase is valid (either by checking availability or directly trying to get the session)
            // We use the negation here because available: true means the phrase is not used yet
            const { available } = await sessionService.checkSecretPhraseAvailability(phrase);
            
            if (available) {
                toast.error("Invalid secret phrase. Please try again.");
                return;
            }
            
            onPhraseConfirmed(phrase);
            setOpen(false);
            setPhrase("");
        } catch (error) {
            console.error("Error checking secret phrase:", error);
            toast.error("An error occurred. Please try again.");
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Have a Secret Phrase?</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Enter Secret Phrase</DialogTitle>
                    <DialogDescription>
                        Enter the secret phrase to access a private voting session.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <Input
                        id="phrase"
                        value={phrase}
                        onChange={(e) => setPhrase(e.target.value)}
                        placeholder="Enter secret phrase"
                        className="w-full"
                        autoComplete="off"
                        disabled={isChecking}
                    />
                    <DialogFooter className="sm:justify-end">
                        <Button type="submit" disabled={isChecking}>
                            {isChecking ? "Checking..." : "Confirm"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
