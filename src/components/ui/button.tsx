import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e1a] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
    {
        variants: {
            variant: {
                default: "bg-[#00d4ff] text-[#0a0e1a] shadow-lg shadow-[#00d4ff]/25 hover:bg-[#00c8ff]",
                destructive: "bg-red-500 text-white shadow-lg shadow-red-500/25 hover:bg-red-600",
                outline: "border border-[#1e3a5f] bg-transparent text-[#94a3b8] hover:bg-[#1e3a5f] hover:text-white",
                secondary: "bg-[#1e293b] text-white hover:bg-[#2a3a5f]",
                ghost: "text-[#94a3b8] hover:bg-[#1e3a5f] hover:text-white",
                link: "text-[#00d4ff] underline-offset-4 hover:underline",
                gradient: "bg-gradient-to-r from-[#00d4ff] to-[#0066ff] text-white shadow-lg shadow-[#00d4ff]/25 hover:from-[#00c8ff] hover:to-[#0088ff]",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3 text-xs",
                lg: "h-11 rounded-lg px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
