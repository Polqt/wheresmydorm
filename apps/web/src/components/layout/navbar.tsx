"use client";

import Image from "next/image";
import logoSrc from "@/assets/images/LOGO WMD.svg";
import { LiquidGlassPillLink } from "@/components/ui/liquid-glass-pill";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "Community", href: "#community" },
  { label: "Pricing", href: "#pricing" },
] as const;

function handleNavScroll(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
  e.preventDefault();
  const target = document.querySelector(href);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export type MarketingNavbarBarProps = {
  variant?: "light" | "dark";
  /** Extra classes on the inner `<nav>` pill surface */
  navClassName?: string;
};

export function MarketingNavbarBar({
  variant = "light",
  navClassName,
}: MarketingNavbarBarProps) {
  const isDark = variant === "dark";

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        "flex w-full max-w-3xl items-center justify-between gap-4 rounded-full border px-3 py-2 shadow-[0_8px_32px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:gap-6 sm:px-4 sm:py-2.5",
        isDark
          ? "border-white/15 bg-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
          : "border-marketing-border/80 bg-white/40",
        navClassName,
      )}
    >
      <a
        href="/"
        aria-label="Where's My Dorm — home"
        className="shrink-0 rounded-full pl-1 focus-visible:outline-2 focus-visible:outline-[#5b6fd1] focus-visible:outline-offset-2"
      >
        <Image
          src={logoSrc}
          alt="Where's My Dorm"
          height={28}
          priority
          className={cn("h-7 w-auto", isDark && "brightness-0 invert")}
        />
      </a>

      <ul className="hidden items-center gap-1.5 sm:flex" role="list">
        {NAV_LINKS.map(({ label, href }) => (
          <li key={href}>
            <LiquidGlassPillLink
              href={href}
              size="sm"
              variant={isDark ? "onDark" : "light"}
              onClick={(e) => handleNavScroll(e, href)}
              className={cn("font-medium", !isDark && "!shadow-none border-white/40")}
            >
              {label}
            </LiquidGlassPillLink>
          </li>
        ))}
      </ul>

      <LiquidGlassPillLink
        href="#"
        size="md"
        variant={isDark ? "onDark" : "light"}
        className={cn(
          "shrink-0 font-semibold",
          isDark
            ? "!border-transparent !bg-white !text-marketing-ink !shadow-none hover:!bg-white/90 hover:!text-marketing-ink"
            : "!bg-marketing-ink !text-marketing-headline-sand border-marketing-ink/20 hover:!bg-marketing-ink/90 hover:!text-white",
        )}
        aria-label="Get the app"
      >
        Get the app
      </LiquidGlassPillLink>
    </nav>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 flex justify-center bg-marketing-canvas/80 px-5 pb-2 pt-4 backdrop-blur-sm">
      <MarketingNavbarBar variant="light" />
    </header>
  );
}
