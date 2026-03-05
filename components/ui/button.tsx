import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Ripple } from "./ripple"

const buttonVariants = cva(
    "relative inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-38 overflow-hidden",
    {
        variants: {
            variant: {
                default: "bg-surface-container-highest text-foreground hover:bg-black/5 active:bg-black/10 dark:hover:bg-white/5 dark:active:bg-white/10",
                filled:
                    "bg-primary text-primary-foreground shadow-m3-1 hover:shadow-m3-2 hover:bg-primary/90 active:bg-primary/80",
                tonal:
                    "bg-secondary-container text-secondary-foreground hover:bg-secondary-container/80 active:bg-secondary-container/70",
                elevated:
                    "bg-surface-container-low text-primary shadow-m3-1 hover:shadow-m3-2 hover:bg-surface-container active:bg-surface-container-high",
                outlined:
                    "border border-border bg-transparent hover:bg-surface-variant/50 active:bg-surface-variant/80 text-primary",
                text: "bg-transparent hover:bg-surface-variant/50 active:bg-surface-variant/80 text-primary",
                destructive:
                    "bg-destructive text-destructive-foreground shadow-m3-1 hover:bg-destructive/90 active:bg-destructive/80",
            },
            size: {
                default: "h-10 px-6 py-2",
                sm: "h-9 rounded-full px-4 text-xs",
                lg: "h-12 rounded-full px-8",
                icon: "h-10 w-10 text-xl",
            },
        },
        defaultVariants: {
            variant: "filled",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
    disableRipple?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, disableRipple = false, children, ...props }, ref) => {
        const isOutlinedOrText = variant === "outlined" || variant === "text" || variant === "tonal" || variant === "elevated" || variant === "default";
        const rippleColor = isOutlinedOrText ? 'rgba(var(--primary), 0.12)' : 'rgba(255, 255, 255, 0.2)';

        if (asChild) {
            return (
                <Slot
                    className={cn(buttonVariants({ variant, size, className }))}
                    ref={ref}
                    {...props}
                >
                    {children}
                </Slot>
            )
        }

        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            >
                <div className="relative z-10 flex items-center justify-center gap-2">
                    {children}
                </div>
                {!disableRipple && !props.disabled && <Ripple color={rippleColor} />}
            </button>
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
