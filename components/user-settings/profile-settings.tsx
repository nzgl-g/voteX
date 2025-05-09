import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Camera, Check, Pencil, Dices, Loader2 } from "lucide-react";
import { authApi } from "@/lib/api";

interface ProfileSettingsProps {
    onSave: () => void;
    userData?: any;
}

export function ProfileSettings({ onSave, userData }: ProfileSettingsProps) {
    const [username, setUsername] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [gender, setGender] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const fileInputRef = useState<HTMLInputElement | null>(null);
    const { toast } = useToast();

    // Update form fields when userData changes
    useEffect(() => {
        if (userData) {
            setUsername(userData.username || "");
            setFullName(userData.fullName || "");
            setEmail(userData.email || "");
            setGender(userData.gender || "");
            setAvatarUrl(userData.profilePic || "");
        }
    }, [userData]);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                if (event.target?.result) {
                    const newAvatarUrl = event.target.result.toString();
                    setAvatarUrl(newAvatarUrl);
                    
                    try {
                        setLoading(true);
                        await authApi.updateProfile({ profilePic: newAvatarUrl });
                        toast({ title: "Avatar updated successfully!", duration: 2000 });
                        onSave();
                    } catch (error: any) {
                        toast({ 
                            title: "Failed to update avatar", 
                            description: error.message,
                            variant: "destructive" 
                        });
                    } finally {
                        setLoading(false);
                    }
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const generateRandomAvatar = async () => {
        const seed = Math.floor(Math.random() * 1000);
        const newAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
        setAvatarUrl(newAvatarUrl);
        
        try {
            setLoading(true);
            await authApi.updateProfile({ profilePic: newAvatarUrl });
            toast({
                title: "Random avatar generated!",
                description: "How's this look? ",
                duration: 2000
            });
            onSave();
        } catch (error: any) {
            toast({ 
                title: "Failed to update avatar", 
                description: error.message,
                variant: "destructive" 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    };

    const handleEmailBlur = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast({
                title: "Invalid email format",
                description: "Please enter a valid email address",
                variant: "destructive",
            });
            return;
        }

        // Skip update if email hasn't changed
        if (userData && userData.email === email) {
            return;
        }

        try {
            setLoading(true);
            await authApi.updateProfile({ email });
            toast({
                title: "Email updated successfully!",
                description: "We've sent a verification email to your new address",
            });
            onSave();
        } catch (error: any) {
            toast({ 
                title: "Failed to update email", 
                description: error.message,
                variant: "destructive" 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^a-zA-Z0-9_]/g, "");
        setUsername(value);
    };

    const handleUsernameBlur = async () => {
        if (username.length < 3) {
            toast({
                title: "Username too short",
                description: "Username must be at least 3 characters.",
                variant: "destructive"
            });
            return;
        }
        // Skip update if username hasn't changed
        if (userData && userData.username === username) {
            return;
        }
        try {
            setLoading(true);
            const available = await authApi.checkUsernameAvailability(username);
            if (!available) {
                toast({
                    title: "Username unavailable",
                    description: "This username is already taken. Please choose another.",
                    variant: "destructive"
                });
                return;
            }
            await authApi.updateProfile({ username });
            toast({ title: "Username updated successfully!", duration: 2000 });
            onSave();
        } catch (error: any) {
            toast({ 
                title: "Failed to update username", 
                description: error.message,
                variant: "destructive" 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleFullNameBlur = async () => {
        if (fullName.trim() === "") {
            return;
        }

        // Skip update if fullName hasn't changed
        if (userData && userData.fullName === fullName) {
            return;
        }

        try {
            setLoading(true);
            await authApi.updateProfile({ fullName });
            toast({ title: "Full name updated successfully!", duration: 2000 });
            onSave();
        } catch (error: any) {
            toast({ 
                title: "Failed to update full name", 
                description: error.message,
                variant: "destructive" 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGenderChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newGender = e.target.value;
        setGender(newGender);
        
        if (!newGender || (userData && userData.gender === newGender)) {
            return;
        }
        
        try {
            setLoading(true);
            await authApi.updateProfile({ gender: newGender });
            toast({ title: "Gender updated successfully!", duration: 2000 });
            onSave();
        } catch (error: any) {
            toast({ 
                title: "Failed to update gender", 
                description: error.message,
                variant: "destructive" 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-lg font-medium">Profile Settings</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your personal information and how it appears to others.
                </p>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                <div className="flex flex-col items-center gap-3">
                    <Avatar className="h-24 w-24 border-2 border-border shadow-md">
                        <AvatarImage src={avatarUrl} alt={fullName} />
                        <AvatarFallback>
                            {fullName ? fullName.split(' ').map(part => part[0]).join('') : '?'}
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
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                            <span>Change</span>
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 text-xs"
                            onClick={generateRandomAvatar}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Dices className="h-3.5 w-3.5" />}
                            <span>Random</span>
                        </Button>
                    </div>
                </div>

                <div className="space-y-4 flex-1 w-full">
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <div className="relative">
                            <Input
                                id="username"
                                value={username}
                                onChange={handleUsernameChange}
                                className="pr-10"
                                onBlur={handleUsernameBlur}
                                disabled={loading}
                            />
                            <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground">
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
                                onBlur={handleFullNameBlur}
                                disabled={loading}
                            />
                            <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <select
                            id="gender"
                            value={gender}
                            onChange={handleGenderChange}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={loading}
                        >
                            <option value="">Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Prefer not to say">Prefer not to say</option>
                        </select>
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
                                disabled={loading}
                            />
                            <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            We'll send a verification email if you change this.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
