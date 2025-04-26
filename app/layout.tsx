import type { Metadata } from "next";
import { Inter} from "next/font/google";
import "./globals.css";
import {ThemeProvider} from "@/components/theme-provider";
import {cn} from "@/lib/utils";
import NextTopLoader from 'nextjs-toploader';

const inter = Inter({ subsets: ["latin"] });


export const metadata: Metadata = {
  title: "Votex - Voting System",
  description: "A comprehensive voting system for various election types",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-br" suppressHydrationWarning>
        <body className={cn("min-h-screen bg-background", inter.className)}>
        <NextTopLoader 
          color="#2563eb"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #2563eb,0 0 5px #2563eb"
        />
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >

            {children}
        </ThemeProvider>
        </body>
        </html>
    );
}
