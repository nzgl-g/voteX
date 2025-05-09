"use client";

import { ReactNode } from "react";
import { NotificationProvider } from "@/components/shared/notification-provider";

export default function VoterLayout({ children }: { children: ReactNode }) {
  return (
    <NotificationProvider>
      {children}
    </NotificationProvider>
  );
} 