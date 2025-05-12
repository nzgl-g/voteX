import type {Metadata} from "next";
import {Inter} from "next/font/google";
import "./globals.css";
import {ThemeProvider} from "@/components/theme-provider";
import {cn} from "@/lib/utils";
import {ClientLoadingBar} from "@/components/ui/client-loading-bar";
import {Toaster} from "sonner";
import {StagewiseToolbar} from '@stagewise/toolbar-next';
import {NotificationProvider} from "@/components/shared/notification-provider";

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
        <html lang="en" suppressHydrationWarning>
        <body className={cn("min-h-screen bg-background", inter.className)}>
        <ClientLoadingBar />
        <NotificationProvider>

            <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <Toaster 
              position="bottom-center"
              toastOptions={{
                style: {
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                },
              }}
            />
                <StagewiseToolbar
                    config={{
                        plugins: [], // Add your custom plugins here
                    }}
                />
            {children}
        </ThemeProvider>
        </NotificationProvider>

        </body>
        </html>
    );
}
