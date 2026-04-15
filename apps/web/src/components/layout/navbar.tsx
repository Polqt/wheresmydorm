"use client";

import Image from "next/image";
import logoSrc from "@/assets/images/LOGO WMD.svg";

const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "Community", href: "#community" },
  { label: "Pricing", href: "#pricing" },
] as const;

export function Navbar() {
  function handleScroll(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <header className="pointer-events-none sticky top-0 z-40 flex justify-center px-5 pt-4 pb-2">
      <nav
        aria-label="Main navigation"
        className="pointer-events-auto flex w-full max-w-3xl items-center justify-between gap-6 rounded-full border border-[#1C1917]/12 bg-[#FDFBF7]/90 px-4 py-2.5 shadow-[0_8px_24px_rgba(28,25,23,0.10)] backdrop-blur-md"
      >
        {/* Logo */}
        <a
          href="/"
          aria-label="Where's My Dorm — home"
          className="shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-[#C4622D] focus-visible:outline-offset-2"
        >
          <Image
            src={logoSrc}
            alt="Where's My Dorm"
            height={28}
            priority
            className="h-7 w-auto"
          />
        </a>

        {/* Nav links */}
        <ul className="hidden items-center gap-1 sm:flex" role="list">
          {NAV_LINKS.map(({ label, href }) => (
            <li key={href}>
              <a
                href={href}
                onClick={(e) => handleScroll(e, href)}
                className="inline-flex h-9 items-center rounded-full px-4 font-medium text-[#44403C] text-sm transition-colors duration-[180ms] hover:bg-[#1C1917]/06 hover:text-[#1C1917] focus-visible:outline-2 focus-visible:outline-[#C4622D] focus-visible:outline-offset-2"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <a
          href="#"
          className="inline-flex h-10 shrink-0 items-center rounded-full bg-[#C4622D] px-5 font-medium text-sm text-white shadow-[0_3px_10px_rgba(196,98,45,0.3)] transition-colors duration-[180ms] hover:bg-[#A84E23] focus-visible:outline-2 focus-visible:outline-[#C4622D] focus-visible:outline-offset-2 active:scale-[0.98]"
          aria-label="Get the app"
        >
          Get the app
        </a>
      </nav>
    </header>
  );
}
