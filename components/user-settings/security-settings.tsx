import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, EyeOff, Lock, Wallet } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface SecuritySettingsProps {
    onSave: () => void;
}

export function SecuritySettings({ onSave }: SecuritySettingsProps) {
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [walletConnected, setWalletConnected] = useState(false);
    const [walletAddress, setWalletAddress] = useState("");
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

    const connectWallet = async () => {
        if (typeof window.ethereum === "undefined") {
            toast({
                title: "MetaMask not found",
                description: "Couldn't find your fox, please try again 🦊",
                variant: "destructive",
            });
            return;
        }

        try {
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            const address = accounts[0];
            setWalletAddress(address);
            setWalletConnected(true);

            toast({
                title: "Wallet connected! 🦊",
                description: `Connected to ${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
            });

            onSave();
        } catch (error) {
            toast({
                title: "Connection failed",
                description: "Could not connect to MetaMask",
                variant: "destructive",
            });
        }
    };

    const disconnectWallet = () => {
        setWalletConnected(false);
        setWalletAddress("");

        toast({
            title: "Wallet disconnected",
            description: "Your wallet has been disconnected",
        });

        onSave();
    };

    // Mock function to simulate MetaMask availability
    if (typeof window !== "undefined" && typeof window.ethereum === "undefined") {
        // @ts-ignore - Just to simulate MetaMask
        window.ethereum = {
            request: async ({ method }: { method: string }) => {
                if (method === "eth_requestAccounts") {
                    return ["0x71C7656EC7ab88b098defB751B7401B5f6d8976F"];
                }
                return null;
            },
        };
    }

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-lg font-medium">Security Settings</h3>
                <p className="text-sm text-gray-500">
                    Manage your account security and connected services.
                </p>
            </div>

            <div className="space-y-6">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium flex items-center gap-2">
                                <Lock className="h-4 w-4 text-gray-500" />
                                Password
                            </h4>
                            <p className="text-sm text-gray-500">
                                Secure your account with a strong password
                            </p>
                        </div>
                        <Button onClick={() => setPasswordModalOpen(true)}>
                            Change Password
                        </Button>
                    </div>
                </div>

                <div className="space-y-3 border-t pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium flex items-center gap-2">
                                <Wallet className="h-4 w-4 text-gray-500" />
                                Wallet Connection
                            </h4>
                            <p className="text-sm text-gray-500">
                                Connect your MetaMask wallet to enable Web3 features
                            </p>
                        </div>
                        {walletConnected ? (
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-right">
                                    {`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={disconnectWallet}
                                >
                                    Disconnect Wallet
                                </Button>
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                className="border-amber-500 hover:bg-amber-50 text-amber-700"
                                onClick={connectWallet}
                            >
                                <img
                                    src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                                    alt="MetaMask"
                                    className="h-4 w-4 mr-2"
                                />
                                Connect MetaMask
                            </Button>
                        )}
                    </div>
                </div>
            </div>

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
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                    {showCurrentPassword ? (
                                        <EyeOff className="h-4 w-4 text-gray-400" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-gray-400" />
                                    )}
                                </button>
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
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                    {showNewPassword ? (
                                        <EyeOff className="h-4 w-4 text-gray-400" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-gray-400" />
                                    )}
                                </button>
                            </div>

                            {newPassword && (
                                <div className="mt-2 space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span>Password strength:</span>
                                        <span className={
                                            passwordStrength <= 25 ? "text-red-500" :
                                                passwordStrength <= 50 ? "text-yellow-500" :
                                                    passwordStrength <= 75 ? "text-green-400" :
                                                        "text-green-500"
                                        }>
                      {getPasswordStrengthLabel()}
                    </span>
                                    </div>
                                    <Progress
                                        value={passwordStrength}
                                        className={`h-1 ${getPasswordStrengthColor()}`}
                                    />
                                </div>
                            )}
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
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4 text-gray-400" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-gray-400" />
                                    )}
                                </button>
                            </div>

                            {confirmPassword && newPassword !== confirmPassword && (
                                <p className="text-xs text-red-500 mt-1">
                                    Passwords don't match
                                </p>
                            )}
                        </div>

                        <DialogFooter className="pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setPasswordModalOpen(false)}
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