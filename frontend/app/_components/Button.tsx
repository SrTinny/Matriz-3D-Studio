"use client";
import { ButtonHTMLAttributes } from "react";
import cn from "clsx";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "danger";
  loading?: boolean;
};

export default function Button({ className, variant = "primary", loading, children, disabled, ...rest }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const styles: Record<NonNullable<Props["variant"]>, string> = {
    primary: "bg-black text-white hover:bg-black/90 focus:ring-black",
    outline: "border border-gray-300 hover:bg-gray-50 focus:ring-gray-300",
    ghost:   "hover:bg-gray-100",
    danger:  "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600",
  };
  return (
    <button
      className={cn(base, styles[variant], className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />}
      {children}
    </button>
  );
}
