import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#00d4ff] focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-[#00d4ff] text-[#0a0e1a] shadow-lg shadow-[#00d4ff]/25",
                secondary:
                    "border-transparent bg-[#1e293b] text-white hover:bg-[#2a3a5f]",
                destructive:
                    "border-transparent bg-red-500 text-white shadow-lg shadow-red-500/25",
                outline: "border-[#1e3a5f] text-[#94a3b8]",
                success:
                    "border-transparent bg-green-500/20 text-green-400 border-green-500/30",
                warning:
                    "border-transparent bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
