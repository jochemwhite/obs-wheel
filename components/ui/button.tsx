import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-[family-name:var(--font-bungee)] tracking-wide transition-all duration-150 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed select-none",
  {
    variants: {
      variant: {
        spin: "bg-gradient-to-br from-[#ff5f6d] to-[#ff8c42] text-white rounded-full shadow-[0_4px_20px_rgba(255,95,109,0.45)] hover:enabled:-translate-y-0.5 hover:enabled:shadow-[0_8px_28px_rgba(255,95,109,0.55)] active:enabled:translate-y-0",
        add:  "bg-[#f0c040] text-[#1a1000] rounded-lg hover:opacity-90 hover:-translate-y-px",
        ghost:"border border-[#2a2a3d] text-[#6b6b88] rounded-lg hover:border-[#f0c040] hover:text-[#f0c040] font-[family-name:var(--font-dm)] text-sm font-semibold",
        danger:"border border-[#ff5f6d22] text-[#ff5f6d] rounded-lg hover:border-[#ff5f6d] font-[family-name:var(--font-dm)] text-sm font-semibold",
        close: "bg-[#f0c040] text-[#1a1000] rounded-full hover:opacity-85",
      },
      size: {
        sm:  "px-3 py-2 text-xs",
        md:  "px-4 py-2.5 text-sm",
        lg:  "px-12 py-3.5 text-lg",
        icon:"p-2",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size:    "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
