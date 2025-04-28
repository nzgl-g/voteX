"use client"

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shadcn-ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuLabel,
} from "@/components/shadcn-ui/dropdown-menu";
import { Settings, LogOut, User } from "lucide-react";
import { SettingsDialog } from "@/components/user-settngs/settings-dialog";
import { authApi } from "@/lib/api";
import { useRouter } from "next/navigation";

export interface UserProfileProps {
    userName?: string;
    userEmail?: string;
    userAvatar?: string;
    variant?: "sidebar" | "dropdown";
    className?: string;
}

export function UserProfile({ 
    userName = "User", 
    userEmail, 
    userAvatar,
    variant = "dropdown",
    className = ""
}: UserProfileProps) {
    const [settingsOpen, setSettingsOpen] = useState(false);
    const router = useRouter();
    
    const initials = userName
        ? userName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
        : "U";
        
    const handleLogout = () => {
        authApi.logout();
        router.push('/');
    };

    // Dropdown variant (used in voter portal, mobile headers, etc.)
    if (variant === "dropdown") {
        return (
            <>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className={`flex items-center space-x-2 rounded-full p-1 outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
                            <Avatar className="h-8 w-8 cursor-pointer">
                                <AvatarImage src={userAvatar} alt={userName} />
                                <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <div className="flex items-center justify-start gap-2 p-2">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={userAvatar} alt={userName} />
                                <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col space-y-1 leading-none">
                                <p className="font-medium">{userName}</p>
                                {userEmail && <p className="text-xs text-muted-foreground">{userEmail}</p>}
                            </div>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                
                <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
            </>
        );
    }

    // Sidebar variant (used in team leader/member sidebar)
    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className={`flex w-full items-center gap-2 rounded-lg p-2 text-left hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${className}`}>
                        <Avatar className="h-8 w-8 rounded-lg">
                            <AvatarImage src={userAvatar} alt={userName} />
                            <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-medium">{userName}</span>
                            {userEmail && <span className="truncate text-xs">{userEmail}</span>}
                        </div>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    className="w-56 rounded-lg"
                    align="start"
                    side="right"
                    sideOffset={4}
                >
                    <DropdownMenuLabel className="p-0 font-normal">
                        <div className="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
                            <Avatar className="h-10 w-10 rounded-lg">
                                <AvatarImage src={userAvatar} alt={userName} />
                                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">{userName}</span>
                                {userEmail && <span className="truncate text-xs">{userEmail}</span>}
                            </div>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            
            <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </>
    );
}
