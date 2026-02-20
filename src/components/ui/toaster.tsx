"use client"

import { useToast } from "@/hooks/use-toast"
import {
    Toast,
    ToastClose,
    ToastDescription,
    ToastProvider,
    ToastTitle,
    ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export function Toaster() {
    const { toasts } = useToast()

    return (
        <ToastProvider>
            {toasts.map(function ({ id, title, description, variant, ...props }) {
                return (
                    <Toast key={id} variant={variant} {...props}>
                        <div className="flex items-start gap-3">
                            <div className="shrink-0 mt-0.5">
                                {variant === "destructive" ? (
                                    <XCircle className="w-5 h-5 text-red-400" />
                                ) : (
                                    <CheckCircle className="w-5 h-5 text-[#00d4ff]" />
                                )}
                            </div>
                            <div className="grid gap-1">
                                {title && <ToastTitle>{title}</ToastTitle>}
                                {description && (
                                    <ToastDescription>{description}</ToastDescription>
                                )}
                            </div>
                        </div>
                        <ToastClose />
                    </Toast>
                )
            })}
            <ToastViewport />
        </ToastProvider>
    )
}
