import type { HTMLAttributes, PropsWithChildren } from "react";

export function Card({
  children,
  className = "",
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      {...props}
      className={`rounded-2xl bg-surface-container-lowest shadow-[0_20px_40px_rgba(13,27,52,0.04)] ${className}`.trim()}
    >
      {children}
    </div>
  );
}
