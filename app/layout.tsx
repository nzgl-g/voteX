import type { Metadata } from "next";
import { Inter} from "next/font/google";
import "./globals.css";
import {ThemeProvider} from "@/components/theme-provider";
import {cn} from "@/lib/utils";
import { ClientLoadingBar } from "@/components/ui/client-loading-bar";

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
        <ClientLoadingBar />
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
