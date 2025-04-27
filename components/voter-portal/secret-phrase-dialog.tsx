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

interface SecretPhraseDialogProps {
    onPhraseConfirmed: (phrase: string) => void;
}

export function SecretPhraseDialog({ onPhraseConfirmed }: SecretPhraseDialogProps) {
    const [phrase, setPhrase] = useState("");
    const [open, setOpen] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (phrase.trim()) {
            onPhraseConfirmed(phrase);
            setOpen(false);
            setPhrase("");
            toast.success("Secret phrase confirmed");
        } else {
            toast.error("Please enter a secret phrase");
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
                    />
                    <DialogFooter className="sm:justify-end">
                        <Button type="submit">Confirm</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
