import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SecuritySettingsProps {
    onSave: () => void;
}

export function SecuritySettings({ onSave }: SecuritySettingsProps) {
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { toast } = useToast();

    const calculatePasswordStrength = (password: string): number => {
        if (!password) return 0;

        let strength = 0;

        // Length
        if (password.length >= 8) strength += 25;

        // Uppercase
        if (/[A-Z]/.test(password)) strength += 25;

        // Lowercase
        if (/[a-z]/.test(password)) strength += 25;

        // Numbers or special chars
        if (/[0-9!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 25;

        return strength;
    };

    const passwordStrength = calculatePasswordStrength(newPassword);

    const getPasswordStrengthLabel = (): string => {
        if (passwordStrength <= 25) return "Weak";
        if (passwordStrength <= 50) return "Fair";
        if (passwordStrength <= 75) return "Good";
        return "Strong";
    };

    const getPasswordStrengthColor = (): string => {
        if (passwordStrength <= 25) return "bg-red-500";
        if (passwordStrength <= 50) return "bg-yellow-500";
        if (passwordStrength <= 75) return "bg-green-400";
        return "bg-green-500";
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentPassword) {
            toast({
                title: "Current password required",
                description: "Please enter your current password",
                variant: "destructive",
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            toast({
                title: "Passwords don't match",
                description: "New password and confirmation must be identical",
                variant: "destructive",
            });
            return;
        }

        if (passwordStrength < 50) {
            toast({
                title: "Password too weak",
                description: "Please use a stronger password with mixed characters",
                variant: "destructive",
            });
            return;
        }

        // Success case
        setPasswordModalOpen(false);
        toast({
            title: "Password updated successfully! 🔒",
            description: "Your account is now more secure.",
        });

        // Reset form
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        onSave();
    };

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-lg font-medium">Security Settings</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your account security and authentication methods.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Lock className="h-4 w-4 text-primary" />
                        Password
                    </CardTitle>
                    <CardDescription>
                        Secure your account with a strong password
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Password last changed: <span className="font-medium">2 months ago</span>
                            </p>
                        </div>
                        <Button onClick={() => setPasswordModalOpen(true)}>
                            Change Password
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Future security options can be added here */}
            {/* For example, two-factor authentication, login history, etc. */}

            {/* Password Change Modal */}
            <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                            Create a new password for your account. Make sure it's strong and unique.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handlePasswordSubmit} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="current-password">Current Password</Label>
                            <div className="relative">
                                <Input
                                    id="current-password"
                                    type={showCurrentPassword ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                    {showCurrentPassword ? (
                                        <EyeOff className="h-4 w-4 text-gray-500" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-gray-500" />
                                    )}
                                    <span className="sr-only">Toggle password visibility</span>
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="new-password"
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                    {showNewPassword ? (
                                        <EyeOff className="h-4 w-4 text-gray-500" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-gray-500" />
                                    )}
                                    <span className="sr-only">Toggle password visibility</span>
                                </Button>
                            </div>

                            <div className="space-y-1 mt-1">
                                <div className="flex justify-between text-xs">
                                    <span>Password strength:</span>
                                    <span className={`font-medium
                                        ${passwordStrength <= 25 ? 'text-red-500' : ''}
                                        ${passwordStrength > 25 && passwordStrength <= 50 ? 'text-yellow-500' : ''}
                                        ${passwordStrength > 50 && passwordStrength <= 75 ? 'text-green-400' : ''}
                                        ${passwordStrength > 75 ? 'text-green-500' : ''}
                                    `}>
                                        {getPasswordStrengthLabel()}
                                    </span>
                                </div>
                                <Progress 
                                    value={passwordStrength} 
                                    className={`h-1.5 ${getPasswordStrengthColor()}`}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirm-password"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4 text-gray-500" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-gray-500" />
                                    )}
                                    <span className="sr-only">Toggle password visibility</span>
                                </Button>
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setPasswordModalOpen(false)}
                                type="button"
                            >
                                Cancel
                            </Button>
                            <Button type="submit">Update Password</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}