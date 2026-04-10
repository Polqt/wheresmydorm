import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

const glassLight =
  "inline-flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200 " +
  "border border-white/50 bg-white/35 backdrop-blur-xl shadow-[0_4px_24px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.6)] " +
  "hover:bg-white/50 hover:shadow-[0_8px_32px_rgba(15,23,42,0.1)] " +
  "focus-visible:outline-2 focus-visible:outline-[#5b6fd1] focus-visible:outline-offset-2 " +
  "active:scale-[0.98]";

const glassOnDark =
  "inline-flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200 " +
  "border border-white/35 bg-white/10 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] " +
  "text-white hover:bg-white/18 hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)] " +
  "focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 " +
  "active:scale-[0.98]";

type LiquidGlassPillLinkProps = ComponentPropsWithoutRef<"a"> & {
  size?: "sm" | "md" | "lg";
  variant?: "light" | "onDark";
};

export function LiquidGlassPillLink({
  className,
  size = "md",
  variant = "light",
  children,
  ...props
}: LiquidGlassPillLinkProps) {
  const sizes = {
    sm: "h-9 px-4",
    md: "h-11 px-6",
    lg: "h-13 px-8 text-base",
  } as const;
  const base = variant === "onDark" ? glassOnDark : glassLight;
  return (
    <a
      className={cn(
        base,
        sizes[size],
        variant === "light" && "text-marketing-ink",
        className,
      )}
      {...props}
    >
      {children}
    </a>
  );
}

type LiquidGlassPillButtonProps = ComponentPropsWithoutRef<"button"> & {
  size?: "sm" | "md" | "lg";
  variant?: "light" | "onDark";
};

export function LiquidGlassPillButton({
  className,
  size = "md",
  variant = "light",
  type = "button",
  children,
  ...props
}: LiquidGlassPillButtonProps) {
  const sizes = {
    sm: "h-9 px-4",
    md: "h-11 px-6",
    lg: "h-13 px-8 text-base",
  } as const;
  const base = variant === "onDark" ? glassOnDark : glassLight;
  return (
    <button
      type={type}
      className={cn(
        base,
        sizes[size],
        variant === "light" && "text-marketing-ink",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
