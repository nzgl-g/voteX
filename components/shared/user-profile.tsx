"use client"

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut, User, LayoutDashboard, Vote } from "lucide-react";
import { SettingsDialog } from "@/components/user-settings/settings-dialog";
import { authService, sessionService } from "@/services";
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
                const sessions = await sessionService.getUserSessions();
                if (sessions && sessions.length > 0) {
                    setHasSessions(true);
                    if (sessions[0]._id) {
                        setSessionId(sessions[0]._id);
                    }
                }
            } catch (error) {
                console.error("Error fetching user sessions:", error);
            }
        };

        if (authService.isAuthenticated()) {
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
        authService.logout();
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

    // Animation and styling constants
    const avatarAnimation = "transition-all duration-300 ease-in-out hover:scale-110 active:scale-95";
    const menuItemAnimation = "transition-colors duration-200 ease-out hover:bg-accent/80 hover:text-accent-foreground";
    const iconAnimation = "transition-transform duration-200 group-hover:scale-110 mr-2 h-4 w-4";

    // Dropdown variant
    if (variant === "dropdown") {
        return (
            <>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className={`flex items-center space-x-2 rounded-full p-1 bg-background hover:bg-accent hover:text-accent-foreground transition-all duration-300 ease-out transform hover:scale-105 active:scale-95 outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${className}`}>
                            <Avatar className={`h-8 w-8 cursor-pointer ${avatarAnimation}`}>
                                <AvatarImage src={userAvatar} alt={userName} />
                                <AvatarFallback className="relative flex size-full items-center justify-center overflow-hidden rounded-full">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/70 to-secondary/70 blur-md opacity-80" />
                                    <div className="absolute inset-0 bg-gradient-to-tl from-background/10 to-background/5 mix-blend-overlay" />
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary opacity-70" />
                                    <span className="relative font-semibold z-10 text-white drop-shadow-sm">{initials}</span>
                                </AvatarFallback>
                            </Avatar>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-56 p-1 rounded-xl shadow-lg border border-border/50 backdrop-blur-sm bg-popover/95"
                        sideOffset={8}
                    >
                        <div className="flex items-center gap-3 p-2">
                            <Avatar className={`h-10 w-10 ${avatarAnimation}`}>
                                <AvatarImage src={userAvatar} alt={userName} />
                                <AvatarFallback className="relative flex size-full items-center justify-center overflow-hidden rounded-full">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/70 to-secondary/70 blur-md opacity-80" />
                                    <div className="absolute inset-0 bg-gradient-to-tl from-background/10 to-background/5 mix-blend-overlay" />
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary opacity-70" />
                                    <span className="relative font-semibold z-10 text-white drop-shadow-sm">{initials}</span>
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col space-y-0.5 leading-none overflow-hidden">
                                <p className="font-medium truncate">{userName}</p>
                                {userEmail && (
                                    <p className="text-xs text-muted-foreground truncate">
                                        {userEmail}
                                    </p>
                                )}
                            </div>
                        </div>
                        <DropdownMenuSeparator className="bg-border/50" />
                        {!pathname?.startsWith('/voter') && (
                            <DropdownMenuItem
                                onClick={navigateToVoterPortal}
                                className={`group ${menuItemAnimation}`}
                            >
                                <Vote className={iconAnimation} />
                                <span className="group-hover:translate-x-1 transition-transform duration-200">
                                    Go to Voter Portal
                                </span>
                            </DropdownMenuItem>
                        )}
                        {hasSessions && !pathname?.startsWith('/team-leader') && (
                            <DropdownMenuItem
                                onClick={navigateToDashboard}
                                className={`group ${menuItemAnimation}`}
                            >
                                <LayoutDashboard className={iconAnimation} />
                                <span className="group-hover:translate-x-1 transition-transform duration-200">
                                    Go to Dashboard
                                </span>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator className="bg-border/50" />
                        <DropdownMenuItem
                            onClick={() => setSettingsOpen(true)}
                            className={`group ${menuItemAnimation}`}
                        >
                            <Settings className={iconAnimation} />
                            <span className="group-hover:translate-x-1 transition-transform duration-200">
                                Settings
                            </span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border/50" />
                        <DropdownMenuItem
                            onClick={handleLogout}
                            className={`group text-destructive focus:text-destructive ${menuItemAnimation}`}
                        >
                            <LogOut className={iconAnimation} />
                            <span className="group-hover:translate-x-1 transition-transform duration-200">
                                Log out
                            </span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
            </>
        );
    }

    // Sidebar variant
    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition-all duration-300 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-sm group ${className}`}>
                        <Avatar className={`h-8 w-8 rounded-lg ${avatarAnimation}`}>
                            <AvatarImage src={userAvatar} alt={userName} />
                            <AvatarFallback className="relative flex size-full items-center justify-center overflow-hidden rounded-lg">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/70 to-secondary/70 blur-md opacity-80" />
                                <div className="absolute inset-0 bg-gradient-to-tl from-background/10 to-background/5 mix-blend-overlay" />
                                <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary opacity-70" />
                                <span className="relative font-semibold z-10 text-white drop-shadow-sm">{initials}</span>
                            </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight overflow-hidden">
                            <span className="truncate font-medium transition-all duration-200 group-hover:translate-x-0.5">
                                {userName}
                            </span>
                            {userEmail && (
                                <span className="truncate text-xs text-muted-foreground transition-all duration-200 group-hover:translate-x-0.5">
                                    {userEmail}
                                </span>
                            )}
                        </div>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    className="w-56 rounded-xl shadow-lg border border-border/50 backdrop-blur-sm bg-popover/95"
                    align="start"
                    side="right"
                    sideOffset={8}
                >
                    <DropdownMenuLabel className="p-0 font-normal">
                        <div className="flex items-center gap-3 p-2">
                            <Avatar className={`h-10 w-10 rounded-lg ${avatarAnimation}`}>
                                <AvatarImage src={userAvatar} alt={userName} />
                                <AvatarFallback className="relative flex size-full items-center justify-center overflow-hidden rounded-lg">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/70 to-secondary/70 blur-md opacity-80" />
                                    <div className="absolute inset-0 bg-gradient-to-tl from-background/10 to-background/5 mix-blend-overlay" />
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary opacity-70" />
                                    <span className="relative font-semibold z-10 text-white drop-shadow-sm">{initials}</span>
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight overflow-hidden">
                                <span className="truncate font-medium">{userName}</span>
                                {userEmail && (
                                    <span className="truncate text-xs text-muted-foreground">
                                        {userEmail}
                                    </span>
                                )}
                            </div>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border/50" />
                    {!pathname?.startsWith('/voter') && (
                        <DropdownMenuItem
                            onClick={navigateToVoterPortal}
                            className={`group ${menuItemAnimation}`}
                        >
                            <Vote className={iconAnimation} />
                            <span className="group-hover:translate-x-1 transition-transform duration-200">
                                Go to Voter Portal
                            </span>
                        </DropdownMenuItem>
                    )}
                    {hasSessions && !pathname?.startsWith('/team-leader') && (
                        <DropdownMenuItem
                            onClick={navigateToDashboard}
                            className={`group ${menuItemAnimation}`}
                        >
                            <LayoutDashboard className={iconAnimation} />
                            <span className="group-hover:translate-x-1 transition-transform duration-200">
                                Go to Dashboard
                            </span>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-border/50" />
                    <DropdownMenuItem
                        onClick={() => setSettingsOpen(true)}
                        className={`group ${menuItemAnimation}`}
                    >
                        <Settings className={iconAnimation} />
                        <span className="group-hover:translate-x-1 transition-transform duration-200">
                            Settings
                        </span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/50" />
                    <DropdownMenuItem
                        onClick={handleLogout}
                        className={`group text-destructive focus:text-destructive ${menuItemAnimation}`}
                    >
                        <LogOut className={iconAnimation} />
                        <span className="group-hover:translate-x-1 transition-transform duration-200">
                            Log out
                        </span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </>
    );
}