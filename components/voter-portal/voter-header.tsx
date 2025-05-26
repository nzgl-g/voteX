"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UserProfile } from "@/components/shared/user-profile";
import { NotificationButton } from "@/components/shared/notification-button";
import { motion } from "framer-motion";

export function VoterHeader() {
  const { theme } = useTheme();

  const getLogo = () => {
    if (theme === 'dark') {
      return "/logo/expended-dark.png";
    }
    return "/logo/expended.png";
  };

  return (
    <motion.header
      initial={{ y: -32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 16 }}
      className="mb-4 sticky top-4 z-50 mx-auto w-full container rounded-lg bg-background/80 shadow-lg backdrop-blur-md flex items-center justify-between px-4 py-2 border border-border transition-all"
      style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-center gap-3">
        <div className="relative h-8 w-32 flex items-center justify-center">
          <Image
            src={getLogo()}
            alt="Vote System Logo"
            width={128}
            height={32}
            className="object-contain select-none"
            priority
          />
        </div>
      </div>
      <div className="flex items-center gap-2 bg-muted/40 rounded-full px-2 py-1 transition-all">
        <ThemeToggle className="!rounded-full !bg-transparent !shadow-none !border-0" />
        <NotificationButton />
        <UserProfile className="!rounded-full !bg-transparent !shadow-none !border-0" />
      </div>
    </motion.header>
  );
} 