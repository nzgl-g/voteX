"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/shadcn-ui/button";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Render a placeholder button until mounting is complete to avoid hydration mismatch
  if (!mounted) {
    return (
      <Button
        size="sm"
        variant="ghost"
        className="w-full justify-start"
      >
        <Moon className="size-5" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }
  
  return (
    <Button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      size="sm"
      variant="ghost"
      className="w-full justify-start"
    >
      <div className="flex gap-2 dark:hidden">
        <Moon className="size-5" />
        <span className="block lg:hidden"> Escuro </span>
      </div>

      <div className="dark:flex gap-2 hidden">
        <Sun className="size-5" />
        <span className="block lg:hidden">Claro</span>
      </div>

      <span className="sr-only">Trocar de tema</span>
    </Button>
  );
};
