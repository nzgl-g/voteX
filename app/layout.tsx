import type {Metadata} from "next";
import {Inter} from "next/font/google";
import "./globals.css";
import {ThemeProvider} from "@/components/theme-provider";
import {cn} from "@/lib/utils";
import {Toaster} from "@/components/ui/sonner";
import {StagewiseToolbar} from '@stagewise/toolbar-next';
import {NotificationProvider} from "@/components/shared/notification-provider";

const inter = Inter({ subsets: ["latin"] });

// TODO: Skeletons
// TODO:
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
                className: 'shadow-md',
              }}
            />
                {/*<StagewiseToolbar
                    config={{
                        plugins: [
                        ],
                    }}
                />*/}
            {children}
        </ThemeProvider>
        </NotificationProvider>

        </body>
        </html>
    );
}
