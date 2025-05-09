"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    // Check if the user is authenticated
    const isAuthenticated = authApi.isAuthenticated();
    
    // If not authenticated, redirect to the landing page
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [router]);

  // We could add a loading state here, but for simplicity, we'll just render the children
  return <>{children}</>;
} 