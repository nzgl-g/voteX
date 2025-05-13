"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services';
import { NotificationProvider } from '@/components/shared/notification-provider';
import Link from "next/link";
import { Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientLoadingBar } from "@/components/ui/client-loading-bar";

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    // Check if the user is authenticated
    const isAuthenticated = authService.isAuthenticated();
    
    // If not authenticated, redirect to the landing page
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [router]);

  // We could add a loading state here, but for simplicity, we'll just render the children
  return (
    <NotificationProvider>
        <ClientLoadingBar />
        {children}
    </NotificationProvider>
  );
} 