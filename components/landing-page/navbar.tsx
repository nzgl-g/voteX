"use client";
import { Menu } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AuthButton } from "@/components/auth";
import { motion } from "framer-motion";

interface RouteProps {
  href: string;
  label: string;
}

interface FeatureProps {
  title: string;
  description: string;
}

const routeList: RouteProps[] = [
  {
    href: "#testimonials",
    label: "Testimonials",
  },
  {
    href: "#pricing",
    label: "Pricing",
  },
  {
    href: "#contact",
    label: "Contact",
  },
  {
    href: "#faq",
    label: "FAQ",
  },
];

const featureList: FeatureProps[] = [
  {
    title: "Showcase Your Value ",
    description: "Highlight how your product solves user problems.",
  },
  {
    title: "Build Trust",
    description:
      "Leverages social proof elements to establish trust and credibility.",
  },
  {
    title: "Capture Leads",
    description:
      "Make your lead capture form visually appealing and strategically.",
  },
];

export const Navbar = React.forwardRef<HTMLDivElement>((props, ref) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { resolvedTheme } = useTheme();
  const [logoSrc, setLogoSrc] = useState("/logo/expended.png");
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    if (mounted) {
      setLogoSrc(resolvedTheme === "dark" ? "/logo/expended-dark.png" : "/logo/expended.png");
    }
  }, [resolvedTheme, mounted]);
  
  return (
    <motion.header
      ref={ref}
      initial={{ y: -32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 16 }}
      className="sticky top-0 z-50 mx-auto w-full max-w-3xl sm:max-w-4xl lg:max-w-5xl rounded-full bg-background/80 shadow-lg backdrop-blur-md flex items-center justify-between px-4 py-2 border border-border transition-all"
      style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.04)' }}
    >
      <Link href="/public" className="font-bold text-lg flex items-center">
        <Image src={logoSrc} alt="Vote System Logo" width={128} height={32} className="object-contain select-none" priority />
      </Link>
      {/* <!-- Mobile --> */}
      <div className="flex items-center lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Menu
              onClick={() => setIsOpen(!isOpen)}
              className="cursor-pointer lg:hidden"
            />
          </SheetTrigger>

          <SheetContent
            side="left"
            className="flex flex-col justify-between rounded-tr-2xl rounded-br-2xl bg-card border-secondary"
          >
            <div>
              <SheetHeader className="mb-4 ml-4">
                <SheetTitle className="flex items-center">
                  <Link href="/public" className="flex items-center">
                    <Image src={logoSrc} alt="Vote System Logo" width={120} height={40} className="mr-2" />
                  </Link>
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-2">
                {routeList.map(({ href, label }) => (
                  <Button
                    key={href}
                    onClick={() => setIsOpen(false)}
                    asChild
                    variant="ghost"
                    className="justify-start text-base"
                  >
                    <Link href={href}>{label}</Link>
                  </Button>
                ))}
              </div>
            </div>

            <SheetFooter className="flex-col sm:flex-col justify-start items-start">
              <Separator className="mb-2" />

              <div className="flex items-center gap-2 w-full">
                <ThemeToggle className="rounded-full bg-background hover:bg-accent hover:text-accent-foreground transition-colors !shadow-none !border-0" />
                <AuthButton className="rounded-full bg-background hover:bg-accent hover:text-accent-foreground transition-colors !shadow-none !border-0 w-full" />
              </div>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* <!-- Desktop --> */}
      <NavigationMenu className="hidden lg:flex mx-auto">
        <NavigationMenuList className="flex items-center">
          <NavigationMenuItem>
            <NavigationMenuTrigger className="bg-card text-base">
              Features
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="grid w-[600px] grid-cols-1 gap-5 p-4">
                <ul className="flex flex-col gap-2">
                  {featureList.map(({ title, description }) => (
                    <li
                      key={title}
                      className="rounded-md p-3 text-sm hover:bg-muted"
                    >
                      <p className="mb-1 font-semibold leading-none text-foreground">
                        {title}
                      </p>
                      <p className="line-clamp-2 text-muted-foreground">
                        {description}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem className="flex items-center">
            {routeList.map(({ href, label }) => (
              <NavigationMenuLink key={href} asChild>
                <Link href={href} className="text-base px-4">
                  {label}
                </Link>
              </NavigationMenuLink>
            ))}
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <div className="hidden lg:flex items-center gap-2 bg-muted/40 rounded-full px-2 py-1 transition-all">
        <ThemeToggle className="!rounded-full !bg-transparent !shadow-none !border-0" />
        <AuthButton className="!rounded-full !bg-transparent !shadow-none !border-0" />
      </div>
    </motion.header>
  );
});
