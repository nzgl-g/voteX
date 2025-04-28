"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NextTopLoader from "nextjs-toploader";

export function ClientLoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Force re-render on route changes to trigger the loader
  useEffect(() => {
    // This is just to track route changes
    const url = `${pathname}${searchParams ? `?${searchParams}` : ""}`;
    console.log(`Navigation to: ${url}`);
  }, [pathname, searchParams]);

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
