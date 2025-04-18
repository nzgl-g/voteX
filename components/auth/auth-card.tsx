"use client"

import type { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/shadcn-ui/card"
import { ShineBorder } from "@/components/auth/shine-border"

interface AuthCardProps {
    title: string
    description: string
    children: ReactNode
    footer?: ReactNode
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
    return (
        <Card className="relative overflow-hidden max-w-[400px] w-full mx-auto">
            <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>{children}</CardContent>
            {footer && <CardFooter>{footer}</CardFooter>}
        </Card>
    )
}
