"use client"

import { useState, useEffect, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut, User, LayoutDashboard, Vote } from "lucide-react";
import { SettingsDialog } from "@/components/user-settings/settings-dialog";
import { authService, sessionService } from "@/services";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface UserProfileProps {
    userName?: string;
    userEmail?: string;
    userAvatar?: string;
    variant?: "sidebar" | "dropdown";
    className?: string;
}

const MenuItem = ({
                      icon: Icon,
                      label,
                      onClick,
                      destructive = false,
                  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    onClick: () => void;
    destructive?: boolean;
}) => (
    <div>
        <DropdownMenuItem
            onClick={onClick}
            className={cn(
                "group flex items-center px-3 py-2 rounded-lg my-1",
                "transition-colors duration-200 ease-out",
                destructive
                    ? "text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
                    : "hover:bg-accent/80 hover:text-accent-foreground"
            )}
        >
            <Icon className="mr-3 h-4 w-4 text-current" />
            <span className="text-sm">{label}</span>
        </DropdownMenuItem>
    </div>
);

export function UserProfile({
                                userName = "User",
                                userEmail,
                                userAvatar,
                                variant = "dropdown",
                                className = "",
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
                if (sessions?.length > 0) {
                    setHasSessions(true);
                    setSessionId(sessions[0]._id || null);
                }
            } catch (error) {
                console.error("Error fetching user sessions:", error);
            }
        };

        if (authService.isAuthenticated()) {
            checkUserSessions();
        }
    }, []);

    const initials = useMemo(
        () =>
            userName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase(),
        [userName]
    );

    const handleLogout = () => {
        authService.logout();
        router.push("/");
    };

    const navigateToVoterPortal = () => router.push("/voter");
    const navigateToDashboard = () => {
        if (sessionId) router.push(`/team-leader/monitoring/${sessionId}`);
    };

    const isVoterPage = pathname?.startsWith("/voter");
    const isTeamLeaderPage = pathname?.startsWith("/team-leader");

    const UserAvatar = (
        <Avatar className="h-8 w-8">
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback className="relative flex size-full items-center justify-center overflow-hidden rounded-full bg-primary">
        <span className="relative font-semibold text-white">
          {initials}
        </span>
            </AvatarFallback>
        </Avatar>
    );

    const UserInfo = (
        <div className="flex flex-col space-y-0.5 leading-none overflow-hidden">
            <p className="font-medium truncate">{userName}</p>
            {userEmail && (
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            )}
        </div>
    );

    if (variant === "dropdown") {
        return (
            <>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className={cn(
                                "flex items-center p-1 rounded-full bg-background",
                                "hover:bg-accent hover:text-accent-foreground",
                                "outline-none focus:ring-2 focus:ring-primary",
                                className
                            )}
                        >
                            {UserAvatar}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-64 p-2 rounded-xl border border-border/50 bg-popover"
                        sideOffset={8}
                    >
                        <div className="flex items-center gap-3 p-2">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={userAvatar} alt={userName} />
                                <AvatarFallback className="bg-primary">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            {UserInfo}
                        </div>

                        <DropdownMenuSeparator className="bg-border/50 my-2" />

                        {!isVoterPage && (
                            <MenuItem
                                icon={Vote}
                                label="Go to Voter Portal"
                                onClick={navigateToVoterPortal}
                            />
                        )}

                        {hasSessions && !isTeamLeaderPage && (
                            <MenuItem
                                icon={LayoutDashboard}
                                label="Go to Dashboard"
                                onClick={navigateToDashboard}
                            />
                        )}

                        <DropdownMenuSeparator className="bg-border/50 my-2" />

                        <MenuItem
                            icon={Settings}
                            label="Settings"
                            onClick={() => setSettingsOpen(true)}
                        />

                        <DropdownMenuSeparator className="bg-border/50 my-2" />

                        <MenuItem
                            icon={LogOut}
                            label="Log out"
                            onClick={handleLogout}
                            destructive
                        />
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
                        <button
                        className={cn(
                            "flex w-full items-center gap-3 rounded-lg p-2 text-left",
                            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            "group",
                            className
                        )}
                    >
                        {UserAvatar}
                        <div className="grid flex-1 text-left text-sm leading-tight overflow-hidden">
              <span className="truncate font-medium">
                {userName}
              </span>
                            {userEmail && (
                                <span className="truncate text-xs text-muted-foreground">
                  {userEmail}
                </span>
                            )}
                        </div>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    className="w-64 rounded-xl border border-border/50 bg-popover"
                    align="start"
                    side="right"
                    sideOffset={8}
                >
                    <div className="flex items-center gap-3 p-2">
                        <Avatar className="h-10 w-10 rounded-lg">
                            <AvatarImage src={userAvatar} alt={userName} />
                            <AvatarFallback className="bg-primary">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        {UserInfo}
                    </div>

                    <DropdownMenuSeparator className="bg-border/50 my-2" />

                    {!isVoterPage && (
                        <MenuItem
                            icon={Vote}
                            label="Go to Voter Portal"
                            onClick={navigateToVoterPortal}
                        />
                    )}

                    {hasSessions && !isTeamLeaderPage && (
                        <MenuItem
                            icon={LayoutDashboard}
                            label="Go to Dashboard"
                            onClick={navigateToDashboard}
                        />
                    )}

                    <DropdownMenuSeparator className="bg-border/50 my-2" />

                    <MenuItem
                        icon={Settings}
                        label="Settings"
                        onClick={() => setSettingsOpen(true)}
                    />

                    <DropdownMenuSeparator className="bg-border/50 my-2" />

                    <MenuItem
                        icon={LogOut}
                        label="Log out"
                        onClick={handleLogout}
                        destructive
                    />
                </DropdownMenuContent>
            </DropdownMenu>

            <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </>
    );
}