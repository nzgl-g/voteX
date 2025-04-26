"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CheckCircle, CreditCard, Lock } from "lucide-react"

import { Button } from "@/components/shadcn-ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/shadcn-ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/shadcn-ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/shadcn-ui/form"
import { Input } from "@/components/shadcn-ui/input"
import { Separator } from "@/components/shadcn-ui/separator"

const formSchema = z.object({
    firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
    lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    address: z.string().min(5, { message: "Address must be at least 5 characters." }),
    city: z.string().min(2, { message: "City must be at least 2 characters." }),
    zipCode: z.string().min(5, { message: "Zip code must be at least 5 characters." }),
    cardNumber: z.string().regex(/^\d{16}$/, { message: "Please enter a valid 16-digit card number." }),
    expiryDate: z.string().regex(/^\d{2}\/\d{2}$/, { message: "Please use MM/YY format." }),
    cvc: z.string().regex(/^\d{3,4}$/, { message: "CVC must be 3 or 4 digits." }),
})

interface PaymentFormProps {
    onSuccess?: () => void
    totalAmount?: number
}

export function PaymentForm({ onSuccess, totalAmount = 99.99 }: PaymentFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showSuccessDialog, setShowSuccessDialog] = useState(false)
    const [transactionId, setTransactionId] = useState("")

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            address: "",
            city: "",
            zipCode: "",
            cardNumber: "",
            expiryDate: "",
            cvc: "",
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true)

        // In a real application, you would:
        // 1. Use a secure payment processor like Stripe
        // 2. Never handle card details directly in your code
        // 3. Use tokenization to securely process payments

        console.log("Form submitted:", values)

        // Simulate processing
        setTimeout(() => {
            setIsSubmitting(false)
            // Generate a random transaction ID
            setTransactionId(Math.random().toString(36).substring(2, 15))
            setShowSuccessDialog(true)
        }, 2000)
    }

    function handleGoToDashboard() {
        setShowSuccessDialog(false)
        if (onSuccess) {
            onSuccess()
        }
    }

    return (
        <>
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="text-2xl">Complete Your Payment</CardTitle>
                    <CardDescription>Enter your details to process your payment securely.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <div>
                                <h3 className="text-lg font-medium">Personal Information</h3>
                                <div className="grid gap-4 mt-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="firstName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>First Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="John" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="lastName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Last Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Doe" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem className="mt-4">
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="john.doe@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem className="mt-4">
                                            <FormLabel>Address</FormLabel>
                                            <FormControl>
                                                <Input placeholder="123 Main St" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid gap-4 mt-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="city"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>City</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="New York" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="zipCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Zip Code</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="10001" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <h3 className="text-lg font-medium">Payment Details</h3>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-sm text-muted-foreground">Total Amount</span>
                                    <span className="font-medium">${totalAmount.toFixed(2)}</span>
                                </div>
                                <div className="mt-4 space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="cardNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Card Number</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            placeholder="1234 5678 9012 3456"
                                                            {...field}
                                                            onChange={(e) => {
                                                                // Format card number with spaces for readability
                                                                const value = e.target.value.replace(/\s+/g, "").slice(0, 16)
                                                                field.onChange(value)
                                                            }}
                                                        />
                                                        <CreditCard className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                </FormControl>
                                                <FormDescription>Enter your 16-digit card number</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="expiryDate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Expiry Date</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="MM/YY"
                                                            {...field}
                                                            onChange={(e) => {
                                                                let value = e.target.value.replace(/[^\d]/g, "")
                                                                if (value.length > 2) {
                                                                    value = `${value.slice(0, 2)}/${value.slice(2, 4)}`
                                                                }
                                                                field.onChange(value)
                                                            }}
                                                            maxLength={5}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="cvc"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>CVC</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="123"
                                                            {...field}
                                                            maxLength={4}
                                                            onChange={(e) => {
                                                                const value = e.target.value.replace(/[^\d]/g, "").slice(0, 4)
                                                                field.onChange(value)
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
                                <Lock className="w-5 h-5 mr-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Your payment information is secured with SSL encryption</p>
                            </div>

                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Processing..." : "Complete Payment"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex justify-between text-sm text-muted-foreground">
                    <p>Secure Payment Processing</p>
                    <p>© {new Date().getFullYear()} Your Company</p>
                </CardFooter>
            </Card>

            <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex justify-center mb-4">
                            <CheckCircle className="w-16 h-16 text-green-500" />
                        </div>
                        <DialogTitle className="text-center text-2xl">Payment Successful!</DialogTitle>
                        <DialogDescription className="text-center">Your payment has been processed successfully.</DialogDescription>
                    </DialogHeader>
                    <div className="text-center">
                        <p className="mb-4">
                            Thank you for your purchase. A confirmation email has been sent to your email address.
                        </p>
                        <p className="text-sm text-muted-foreground">Transaction ID: {transactionId}</p>
                    </div>
                    <DialogFooter className="sm:justify-center">
                        <Button onClick={handleGoToDashboard}>Go to Dashboard</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
