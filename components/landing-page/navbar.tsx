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
  
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  return (
    <header
      ref={ref}
      className={`fixed top-0 z-50 w-full bg-background/90 backdrop-blur-md transition-all duration-300 ease-in-out ${scrolled ? 'shadow-md py-1' : 'py-2'}`}
    >
      <div className="mx-auto max-w-4xl sm:max-w-5xl lg:max-w-6xl px-4 flex items-center justify-between">
        {/* Logo - Left Side */}
        <div className="flex-shrink-0">
          <Link href="/public" className="font-bold text-lg flex items-center">
            <Image src={logoSrc} alt="Vote System Logo" width={128} height={32} className="object-contain select-none" priority />
          </Link>
        </div>

        {/* Mobile Menu Button */}
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
              className="flex flex-col justify-between bg-card"
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

        {/* Desktop Navigation - Center */}
        <div className="hidden lg:flex items-center justify-center flex-1">
          <NavigationMenu>
            <NavigationMenuList className="flex items-center">
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-base">
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
        </div>

        {/* Theme Toggle and Auth - Right Side */}
        <div className="hidden lg:flex items-center gap-2 px-2 flex-shrink-0">
          <ThemeToggle className="!rounded-full !bg-transparent !shadow-none !border-0" />
          <AuthButton className="!rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm" />
        </div>
      </div>
    </header>
  );
});
