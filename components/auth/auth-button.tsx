"use client"

import { useState } from "react"
import { Button } from "@/components/shadcn-ui/button"
import { AuthDialog } from "./auth-dialog"
import { VariantProps } from "class-variance-authority"
import React from "react"

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof Button> {
  defaultTab?: "login" | "signup"
  label?: string
}

export function AuthButton({
  defaultTab = "login",
  label,
  className,
  ...props
}: AuthButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button 
        onClick={() => setOpen(true)} 
        className={className} 
        {...props}
      >
        {label || (defaultTab === "login" ? "Sign In" : "Sign Up")}
      </Button>
      <AuthDialog 
        open={open} 
        onOpenChange={setOpen} 
        defaultTab={defaultTab} 
      />
    </>
  )
}
