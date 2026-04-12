"use client";
import { InputHTMLAttributes, forwardRef } from "react";
import cn from "clsx";

type Props = InputHTMLAttributes<HTMLInputElement> & { error?: string };

const Input = forwardRef<HTMLInputElement, Props>(({ className, error, ...rest }, ref) => (
  <div className="space-y-1">
    <input
      ref={ref}
      className={cn(
        "w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black",
        error ? "border-red-500" : "border-gray-300",
        className
      )}
      {...rest}
    />
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
));
Input.displayName = "Input";
export default Input;
