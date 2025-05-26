import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Camera, Check, Pencil, Dices, Loader2, Calendar } from "lucide-react";
import { authService } from "@/services";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface ProfileSettingsProps {
    onSave: () => void;
    userData?: any;
}

export function ProfileSettings({ onSave, userData }: ProfileSettingsProps) {
    const [username, setUsername] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [gender, setGender] = useState("");
    const [nationality, setNationality] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
    const [avatarUrl, setAvatarUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [editField, setEditField] = useState<string | null>(null);
    const fileInputRef = useState<HTMLInputElement | null>(null);
    const { toast } = useToast();

    // Update form fields when userData changes
    useEffect(() => {
        if (userData) {
            setUsername(userData.username || "");
            setFullName(userData.fullName || "");
            setEmail(userData.email || "");
            setGender(userData.gender || "");
            setNationality(userData.nationality || "");
            setDateOfBirth(userData.dateOfBirth ? new Date(userData.dateOfBirth) : undefined);
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
                        await authService.updateProfile({ profilePic: newAvatarUrl });
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
            await authService.updateProfile({ profilePic: newAvatarUrl });
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

    const handleSave = async (field: string, value: any) => {
        if (!value || (userData && userData[field] === value)) {
            setEditField(null);
            return;
        }

        try {
            setLoading(true);
            const updateData: any = {};
            updateData[field] = value;
            
            // Special case for dateOfBirth - convert to ISO string
            if (field === 'dateOfBirth' && value instanceof Date) {
                updateData[field] = value.toISOString();
            }
            
            await authService.updateProfile(updateData);
            toast({ title: `${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!`, duration: 2000 });
            onSave();
            setEditField(null);
        } catch (error: any) {
            toast({ 
                title: `Failed to update ${field}`, 
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

    const validateUsername = async () => {
        if (username.length < 3) {
            toast({
                title: "Username too short",
                description: "Username must be at least 3 characters.",
                variant: "destructive"
            });
            return false;
        }
        
        // Skip check if username hasn't changed
        if (userData && userData.username === username) {
            return true;
        }
        
        try {
            const response = await authService.checkUsernameAvailability(username);
            if (!response.available) {
                toast({
                    title: "Username unavailable",
                    description: "This username is already taken. Please choose another.",
                    variant: "destructive"
                });
                return false;
            }
            return true;
        } catch (error) {
            return false;
        }
    };
    
    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast({
                title: "Invalid email format",
                description: "Please enter a valid email address",
                variant: "destructive",
            });
            return false;
        }
        return true;
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
                            onClick={() => fileInputRef[0]?.click()}
                            disabled={loading}
                        >
                            <Camera className="h-3.5 w-3.5 mr-1" />
                            Upload
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={generateRandomAvatar}
                            disabled={loading}
                        >
                            <Dices className="h-3.5 w-3.5 mr-1" />
                            Random
                        </Button>
                    </div>
                </div>

                <div className="flex-1 space-y-6 w-full">
                    <Card>
                        <CardContent className="p-6 space-y-6">
                            {/* Username */}
                            <div className="flex flex-col space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                                    {editField !== 'username' && (
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 px-2"
                                            onClick={() => setEditField('username')}
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>
                                
                                {editField === 'username' ? (
                                    <div className="flex gap-2">
                                        <Input
                                            id="username"
                                            value={username}
                                            onChange={handleUsernameChange}
                                            className="flex-1"
                                            placeholder="your_username"
                                        />
                                        <Button 
                                            size="sm" 
                                            onClick={async () => {
                                                if (await validateUsername()) {
                                                    handleSave('username', username);
                                                }
                                            }} 
                                            disabled={loading}
                                        >
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">{username}</p>
                                )}
                            </div>

                            {/* Full Name */}
                            <div className="flex flex-col space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                                    {editField !== 'fullName' && (
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 px-2"
                                            onClick={() => setEditField('fullName')}
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>
                                
                                {editField === 'fullName' ? (
                                    <div className="flex gap-2">
                                        <Input
                                            id="fullName"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="flex-1"
                                            placeholder="John Doe"
                                        />
                                        <Button 
                                            size="sm" 
                                            onClick={() => handleSave('fullName', fullName)} 
                                            disabled={loading}
                                        >
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">{fullName || "Not set"}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div className="flex flex-col space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                                    {editField !== 'email' && (
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 px-2"
                                            onClick={() => setEditField('email')}
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>
                                
                                {editField === 'email' ? (
                                    <div className="flex gap-2">
                                        <Input
                                            id="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="flex-1"
                                            placeholder="your.email@example.com"
                                        />
                                        <Button 
                                            size="sm" 
                                            onClick={() => {
                                                if (validateEmail(email)) {
                                                    handleSave('email', email);
                                                }
                                            }} 
                                            disabled={loading}
                                        >
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">{email}</p>
                                )}
                            </div>

                            {/* Gender */}
                            <div className="flex flex-col space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="gender" className="text-sm font-medium">Gender</Label>
                                    {editField !== 'gender' && (
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 px-2"
                                            onClick={() => setEditField('gender')}
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>
                                
                                {editField === 'gender' ? (
                                    <div className="flex gap-2">
                                        <Select
                                            value={gender}
                                            onValueChange={(value) => setGender(value)}
                                        >
                                            <SelectTrigger className="flex-1">
                                                <SelectValue placeholder="Select your gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Male">Male</SelectItem>
                                                <SelectItem value="Female">Female</SelectItem>
                                                <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button 
                                            size="sm" 
                                            onClick={() => handleSave('gender', gender)} 
                                            disabled={loading}
                                        >
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">{gender || "Not set"}</p>
                                )}
                            </div>

                            {/* Nationality */}
                            <div className="flex flex-col space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="nationality" className="text-sm font-medium">Nationality</Label>
                                    {editField !== 'nationality' && (
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 px-2"
                                            onClick={() => setEditField('nationality')}
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>
                                
                                {editField === 'nationality' ? (
                                    <div className="flex gap-2">
                                        <Input
                                            id="nationality"
                                            value={nationality}
                                            onChange={(e) => setNationality(e.target.value)}
                                            className="flex-1"
                                            placeholder="Your nationality"
                                        />
                                        <Button 
                                            size="sm" 
                                            onClick={() => handleSave('nationality', nationality)} 
                                            disabled={loading}
                                        >
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">{nationality || "Not set"}</p>
                                )}
                            </div>

                            {/* Date of Birth */}
                            <div className="flex flex-col space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="dateOfBirth" className="text-sm font-medium">Date of Birth</Label>
                                    {editField !== 'dateOfBirth' && (
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 px-2"
                                            onClick={() => setEditField('dateOfBirth')}
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>
                                
                                {editField === 'dateOfBirth' ? (
                                    <div className="flex gap-2">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !dateOfBirth && "text-muted-foreground"
                                                    )}
                                                >
                                                    <Calendar className="mr-2 h-4 w-4" />
                                                    {dateOfBirth ? format(dateOfBirth, "PPP") : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <CalendarComponent
                                                    mode="single"
                                                    selected={dateOfBirth}
                                                    onSelect={setDateOfBirth}
                                                    initialFocus
                                                    disabled={(date) => date > new Date()}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <Button 
                                            size="sm" 
                                            onClick={() => handleSave('dateOfBirth', dateOfBirth)} 
                                            disabled={loading}
                                        >
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        {dateOfBirth ? format(dateOfBirth, "PPP") : "Not set"}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
