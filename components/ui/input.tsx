import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex-1 bg-[#1e1e2e] border border-[#2a2a3d] rounded-lg text-[#e8e8f0] px-3 py-2 text-sm font-[family-name:var(--font-dm)] transition-colors placeholder:text-[#6b6b88] focus:outline-none focus:border-[#f0c040]",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
