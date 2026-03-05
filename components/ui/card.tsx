import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import { Ripple } from "./ripple"

const cardVariants = cva(
    "relative rounded-2xl text-card-foreground overflow-hidden transition-all duration-200",
    {
        variants: {
            variant: {
                elevated: "bg-surface-container-low shadow-m3-1 hover:shadow-m3-2",
                filled: "bg-surface-container-highest border-none hover:shadow-m3-1",
                outlined: "bg-surface border border-border hover:shadow-m3-1 hover:bg-surface-variant/10",
            },
            interactive: {
                true: "cursor-pointer",
                false: "",
            }
        },
        defaultVariants: {
            variant: "elevated",
            interactive: false,
        },
    }
)

export interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
    disableRipple?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant, interactive, disableRipple = false, children, ...props }, ref) => {
        const isInteractive = interactive || !!props.onClick;

        return (
            <div
                ref={ref}
                className={cn(cardVariants({ variant, interactive: isInteractive, className }))}
                {...props}
            >
                <div className="relative z-10 h-full">{children}</div>
                {isInteractive && !disableRipple && <Ripple />}
            </div>
        )
    }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-6", className)}
        {...props}
    />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn(
            "text-lg font-medium leading-none tracking-tight text-foreground",
            className
        )}
        {...props}
    />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
    />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0 h-full", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center p-6 pt-0", className)}
        {...props}
    />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
