import Link from "next/link";
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: string;
    variant?: "primary" | "secondary" | "ghost";
    className?: string;
  }
>;

const variantClassName: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "editorial-gradient text-white shadow-[0_18px_30px_rgba(57,71,222,0.18)] hover:opacity-95",
  secondary:
    "bg-surface-container-high text-foreground hover:bg-surface-container-highest",
  ghost: "bg-transparent px-0 text-primary hover:underline",
};

const sharedClassName =
  "inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50";

export function Button({
  children,
  href,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const mergedClassName = `${sharedClassName} ${variantClassName[variant]} ${className}`.trim();

  if (href) {
    return (
      <Link href={href} className={mergedClassName}>
        {children}
      </Link>
    );
  }

  return (
    <button {...props} className={mergedClassName}>
      {children}
    </button>
  );
}
