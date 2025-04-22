"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/shadcn-ui/button"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPulsing, setIsPulsing] = useState(false)

  // Pulse animation every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsPulsing(true)
      setTimeout(() => setIsPulsing(false), 1000)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src="/placeholder.svg?height=32&width=32"
            alt="YourVote Logo"
            width={32}
            height={32}
            className="rounded-md"
          />
          <span className="text-xl font-bold">YourVote</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
            Home
          </Link>
          <Link href="/features" className="text-sm font-medium transition-colors hover:text-primary">
            Features
          </Link>
          <Link href="/pricing" className="text-sm font-medium transition-colors hover:text-primary">
            Pricing
          </Link>
          <Link href="/support" className="text-sm font-medium transition-colors hover:text-primary">
            Support
          </Link>
        </nav>

        <div className="hidden md:flex items-center space-x-4">
          <Button
            className={cn("rounded-2xl transition-all", isPulsing && "animate-pulse")}
            aria-label="Log in or sign up"
          >
            Login / Sign Up
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="fixed inset-0 top-16 z-50 flex flex-col bg-background p-6 md:hidden">
          <nav className="flex flex-col space-y-6">
            <Link
              href="/"
              className="text-lg font-medium transition-colors hover:text-primary"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/features"
              className="text-lg font-medium transition-colors hover:text-primary"
              onClick={() => setIsOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="text-lg font-medium transition-colors hover:text-primary"
              onClick={() => setIsOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/support"
              className="text-lg font-medium transition-colors hover:text-primary"
              onClick={() => setIsOpen(false)}
            >
              Support
            </Link>
            <Button className="mt-4 w-full rounded-2xl" onClick={() => setIsOpen(false)} aria-label="Log in or sign up">
              Login / Sign Up
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
