import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-accent-primary text-white hover:bg-accent-primary/90",
        destructive: "bg-error text-white hover:bg-error/90 focus:ring-error",
        outline: "border border-border-primary bg-transparent hover:bg-surface-hover text-text-primary",
        secondary: "bg-surface-secondary text-text-primary hover:bg-surface-hover",
        ghost: "hover:bg-surface-hover text-text-secondary",
        link: "text-accent-primary underline-offset-4 hover:underline",
        primary: "bg-accent-primary text-white hover:bg-accent-primary/90", // Alias for migration
        danger: "bg-error text-white hover:bg-error/90 focus:ring-error", // Alias for migration
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-8 text-lg",
        icon: "h-10 w-10",
        md: "h-10 px-4 py-2", // Alias for migration
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
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, leftIcon, rightIcon, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!isLoading && leftIcon && <span className="mr-2 flex items-center">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2 flex items-center">{rightIcon}</span>}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
