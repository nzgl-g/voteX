"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/shadcn-ui/button";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className }: { className?: string }) {
    const { theme, setTheme } = useTheme();
    const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        setSystemTheme(mediaQuery.matches ? "dark" : "light");

        const handleChange = (e: MediaQueryListEvent) => {
            setSystemTheme(e.matches ? "dark" : "light");
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);

    const SWITCH = () => {
        switch (theme) {
            case "light":
                setTheme("dark");
                break;
            case "dark":
                setTheme("light");
                break;
            case "system":
                setTheme(systemTheme === "light" ? "dark" : "light");
                break;
            default:
                break;
        }
    };

    const TOGGLE_THEME = () => {
        if (typeof document === 'undefined') return;
        
        if (!document.startViewTransition) {
            SWITCH();
            return;
        }

        document.startViewTransition(SWITCH);
    };

    // Prevent hydration issues by not rendering the toggle until after client-side hydration
    if (!mounted) {
        return (
            <Button
                variant="outline"
                size="icon"
                className={`rounded-full bg-background hover:bg-accent hover:text-accent-foreground ${className}`}
                aria-label="Toggle theme"
            >
                <Sun className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">Toggle theme</span>
            </Button>
        );
    }

    return (
        <Button
            onClick={TOGGLE_THEME}
            variant="outline"
            size="icon"
            className={`rounded-full bg-background hover:bg-accent hover:text-accent-foreground ${className}`}
            aria-label="Toggle theme"
        >
            <Sun className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}