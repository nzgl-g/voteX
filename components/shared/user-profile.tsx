"use client"

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shadcn-ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuLabel,
} from "@/components/shadcn-ui/dropdown-menu";
import { Settings, LogOut, User, LayoutDashboard, Vote } from "lucide-react";
import { SettingsDialog } from "@/components/user-settngs/settings-dialog";
import { authApi, sessionApi } from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";

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
    const [hasSessions, setHasSessions] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();
    
    useEffect(() => {
        const checkUserSessions = async () => {
            try {
                const sessions = await sessionApi.getUserSessions();
                if (sessions && sessions.length > 0) {
                    setHasSessions(true);
                    // Store the first session ID to use for dashboard navigation
                    if (sessions[0]._id) {
                        setSessionId(sessions[0]._id);
                    }
                }
            } catch (error) {
                console.error("Error fetching user sessions:", error);
            }
        };
        
        if (authApi.isAuthenticated()) {
            checkUserSessions();
        }
    }, []);
    
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
    
    const navigateToVoterPortal = () => {
        router.push('/voter');
    };
    
    const navigateToDashboard = () => {
        if (sessionId) {
            router.push(`/team-leader/monitoring/${sessionId}`);
        }
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
                        {!pathname?.startsWith('/voter') && (
                            <DropdownMenuItem onClick={navigateToVoterPortal}>
                                <Vote className="mr-2 h-4 w-4" />
                                <span>Go to Voter Portal</span>
                            </DropdownMenuItem>
                        )}
                        {hasSessions && !pathname?.startsWith('/team-leader') && (
                            <DropdownMenuItem onClick={navigateToDashboard}>
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                <span>Go to Dashboard</span>
                            </DropdownMenuItem>
                        )}
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
                    {!pathname?.startsWith('/voter') && (
                        <DropdownMenuItem onClick={navigateToVoterPortal}>
                            <Vote className="mr-2 h-4 w-4" />
                            <span>Go to Voter Portal</span>
                        </DropdownMenuItem>
                    )}
                    {hasSessions && !pathname?.startsWith('/team-leader') && (
                        <DropdownMenuItem onClick={navigateToDashboard}>
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Go to Dashboard</span>
                        </DropdownMenuItem>
                    )}
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
