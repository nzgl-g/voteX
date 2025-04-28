"use client";

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NextTopLoader from 'nextjs-toploader';

export function LoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // This component will re-render on route changes
  // which will trigger the NextTopLoader to show
  
  return (
    <NextTopLoader 
      color="#2563eb"
      initialPosition={0.08}
      crawlSpeed={200}
      height={3}
      showSpinner={false}
      easing="ease"
      speed={200}
      shadow="0 0 10px #2563eb,0 0 5px #2563eb"
      zIndex={9999}
    />
  );
}
