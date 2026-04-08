import type { InputHTMLAttributes } from "react";

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-12 w-full border-0 border-b border-outline bg-surface-container-low px-0 text-sm text-foreground outline-none transition focus:border-primary focus:bg-surface-container-lowest focus:ring-0 ${className}`.trim()}
    />
  );
}
