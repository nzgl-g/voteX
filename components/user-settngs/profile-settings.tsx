import { useState } from "react";
import { Button } from "@/components/shadcn-ui/button";
import { Input } from "@/components/shadcn-ui/input";
import { Label } from "@/components/shadcn-ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shadcn-ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Camera, Check, Pencil, Dices } from "lucide-react";

interface ProfileSettingsProps {
    onSave: () => void;
}

export function ProfileSettings({ onSave }: ProfileSettingsProps) {
    const [username, setUsername] = useState("zenith_user");
    const [usernameAvailable, setUsernameAvailable] = useState(true);
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [fullName, setFullName] = useState("Alex Johnson");
    const [email, setEmail] = useState("alex@example.com");
    const [avatarUrl, setAvatarUrl] = useState("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1780&q=80");
    const fileInputRef = useState<HTMLInputElement | null>(null);
    const { toast } = useToast();

    const checkUsernameAvailability = (value: string) => {
        if (value.length < 3) {
            setUsernameAvailable(false);
            return;
        }

        setIsCheckingUsername(true);
        setTimeout(() => {
            setUsernameAvailable(value !== "admin" && value !== "moderator");
            setIsCheckingUsername(false);
        }, 600);
    };

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^a-zA-Z0-9_]/g, "");
        setUsername(value);
        if (value.length >= 3) {
            checkUsernameAvailability(value);
        } else {
            setUsernameAvailable(false);
        }
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setAvatarUrl(event.target.result.toString());
                    toast({ title: "Avatar updated!", duration: 2000 });
                    onSave();
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const generateRandomAvatar = () => {
        const seed = Math.floor(Math.random() * 1000);
        const newAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
        setAvatarUrl(newAvatarUrl);
        toast({
            title: "Random avatar generated!",
            description: "How's this look? 🎲",
            duration: 2000
        });
        onSave();
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    };

    const handleEmailBlur = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast({
                title: "Invalid email format",
                description: "Please enter a valid email address",
                variant: "destructive",
            });
            return;
        }

        if (email !== "alex@example.com") {
            toast({
                title: "Verification email sent!",
                description: "Please check your inbox to verify your new email address",
            });
        }

        onSave();
    };

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-lg font-medium">Profile Settings</h3>
                <p className="text-sm text-gray-500">
                    Manage your personal information and how it appears to others.
                </p>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                <div className="flex flex-col items-center gap-3">
                    <Avatar className="h-24 w-24 border-2 border-gray-100 shadow-md">
                        <AvatarImage src={avatarUrl} alt={fullName} />
                        <AvatarFallback>
                            {fullName.split(' ').map(part => part[0]).join('')}
                        </AvatarFallback>
                    </Avatar>

                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={(input) => fileInputRef[1](input)}
                        onChange={handleAvatarUpload}
                    />

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 text-xs"
                            onClick={() => fileInputRef[0]?.click()}
                        >
                            <Camera className="h-3.5 w-3.5" />
                            <span>Change</span>
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 text-xs"
                            onClick={generateRandomAvatar}
                        >
                            <Dices className="h-3.5 w-3.5" />
                            <span>Random</span>
                        </Button>
                    </div>
                </div>

                <div className="space-y-4 flex-1 w-full">
                    <div className="space-y-2">
                        <Label htmlFor="username" className="flex items-center gap-2">
                            Username
                            {username.length >= 3 && !isCheckingUsername && usernameAvailable && (
                                <span className="text-green-500 text-xs flex items-center gap-1">
                  <Check className="h-3 w-3" /> Available!
                </span>
                            )}
                            {username.length >= 3 && !isCheckingUsername && !usernameAvailable && (
                                <span className="text-red-500 text-xs">Already taken</span>
                            )}
                        </Label>
                        <div className="relative">
                            <Input
                                id="username"
                                value={username}
                                onChange={handleUsernameChange}
                                className="pr-10"
                                onBlur={() => {
                                    if (usernameAvailable && username.length >= 3) {
                                        onSave();
                                    }
                                }}
                            />
                            <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                        <p className="text-xs text-gray-500">
                            Alphanumeric characters only (a-z, 0-9, _).
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="full-name">Full Name</Label>
                        <div className="relative">
                            <Input
                                id="full-name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="pr-10"
                                onBlur={() => {
                                    if (fullName.trim() !== "") {
                                        onSave();
                                    }
                                }}
                            />
                            <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative">
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={handleEmailChange}
                                onBlur={handleEmailBlur}
                                className="pr-10"
                            />
                            <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                        <p className="text-xs text-gray-500">
                            We'll send a verification email if you change this.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
