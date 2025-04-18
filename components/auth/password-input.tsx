"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/shadcn-ui/input"
import { Button } from "@/components/shadcn-ui/button"
import { Label } from "@/components/shadcn-ui/label"

interface PasswordInputProps {
    id: string
    label: string
    value: string
    onChange: (value: string) => void
    onBlur?: () => void
    error?: string
    placeholder?: string
    required?: boolean
}

export function PasswordInput({
                                  id,
                                  label,
                                  value,
                                  onChange,
                                  onBlur,
                                  error,
                                  placeholder = "••••••••",
                                  required = true,
                              }: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false)

    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            <div className="relative">
                <Input
                    id={id}
                    type={showPassword ? "text" : "password"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    required={required}
                    className={error ? "border-red-500 pr-10" : "pr-10"}
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full w-10 px-0"
                    onClick={() => setShowPassword(!showPassword)}
                >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                </Button>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    )
}
