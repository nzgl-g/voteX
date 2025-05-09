"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SecretPhraseDialogProps } from "./types";

export function SecretPhraseDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isSubmitting 
}: SecretPhraseDialogProps) {
  const [secretPhrase, setSecretPhrase] = useState("");

  const handleSubmit = async () => {
    await onSubmit(secretPhrase);
  };

  const handleCancel = () => {
    setSecretPhrase("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enter Secret Phrase</DialogTitle>
          <DialogDescription>
            Enter the secret phrase to access a private session.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="secret-phrase">Secret Phrase</Label>
            <Input
              id="secret-phrase"
              value={secretPhrase}
              onChange={(e) => setSecretPhrase(e.target.value)}
              placeholder="Enter the secret phrase"
              autoComplete="off"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Checking..." : "Access Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 