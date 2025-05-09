"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { KYCData } from "./voting-dialog"
import { Loader2, Upload } from "lucide-react"



// TODO : add kyc connection to the button
// TODO : add toast for Verification Result
// TODO : Update the voters table with kyc results and user infos
interface KYCFormProps {
    onSubmit: (data: KYCData) => void
    isVerifying: boolean
}

export function KYCForm({ onSubmit, isVerifying }: KYCFormProps) {
    const [formData, setFormData] = useState<KYCData>({
        fullName: "",
        nationality: "",
        dateOfBirth: "",
        idCardNumber: "",
        idCardDocument: null,
    })
    const [dragActive, setDragActive] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))

        // Clear error when field is edited
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev }
                delete newErrors[name]
                return newErrors
            })
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData((prev) => ({ ...prev, idCardDocument: e.target.files![0] }))

            if (errors.idCardDocument) {
                setErrors((prev) => {
                    const newErrors = { ...prev }
                    delete newErrors.idCardDocument
                    return newErrors
                })
            }
        }
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFormData((prev) => ({ ...prev, idCardDocument: e.dataTransfer.files[0] }))

            if (errors.idCardDocument) {
                setErrors((prev) => {
                    const newErrors = { ...prev }
                    delete newErrors.idCardDocument
                    return newErrors
                })
            }
        }
    }

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (!formData.fullName.trim()) {
            newErrors.fullName = "Full name is required"
        }

        if (!formData.nationality.trim()) {
            newErrors.nationality = "Nationality is required"
        }

        if (!formData.dateOfBirth) {
            newErrors.dateOfBirth = "Date of birth is required"
        }

        if (!formData.idCardNumber.trim()) {
            newErrors.idCardNumber = "ID card number is required"
        }

        if (!formData.idCardDocument) {
            newErrors.idCardDocument = "ID card document is required"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (validateForm()) {
            onSubmit(formData)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-2">
            <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={errors.fullName ? "border-red-500" : ""}
                />
                {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="nationality">Nationality</Label>
                <Input
                    id="nationality"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleChange}
                    className={errors.nationality ? "border-red-500" : ""}
                />
                {errors.nationality && <p className="text-sm text-red-500">{errors.nationality}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className={errors.dateOfBirth ? "border-red-500" : ""}
                />
                {errors.dateOfBirth && <p className="text-sm text-red-500">{errors.dateOfBirth}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="idCardNumber">ID Card Number</Label>
                <Input
                    id="idCardNumber"
                    name="idCardNumber"
                    value={formData.idCardNumber}
                    onChange={handleChange}
                    className={errors.idCardNumber ? "border-red-500" : ""}
                />
                {errors.idCardNumber && <p className="text-sm text-red-500">{errors.idCardNumber}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="idCardDocument">ID Card Document</Label>
                <div
                    className={`border-2 border-dashed rounded-md p-6 text-center ${
                        dragActive ? "border-primary bg-primary/10" : "border-gray-300"
                    } ${errors.idCardDocument ? "border-red-500" : ""}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        id="idCardDocument"
                        name="idCardDocument"
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*,.pdf"
                    />
                    <div className="flex flex-col items-center justify-center space-y-2">
                        <Upload className="h-8 w-8 text-gray-500" />
                        <p className="text-sm font-medium">
                            {formData.idCardDocument
                                ? `Selected: ${formData.idCardDocument.name}`
                                : "Drag and drop your ID card document here, or click to select"}
                        </p>
                        <p className="text-xs text-gray-500">Supports: JPG, PNG, PDF (max 5MB)</p>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById("idCardDocument")?.click()}
                        >
                            Select File
                        </Button>
                    </div>
                </div>
                {errors.idCardDocument && <p className="text-sm text-red-500">{errors.idCardDocument}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isVerifying}>
                {isVerifying ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                    </>
                ) : (
                    "Verify"
                )}
            </Button>
        </form>
    )
}
