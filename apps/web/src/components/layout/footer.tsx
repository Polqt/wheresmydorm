import Image from "next/image";
import logoSrc from "@/assets/images/LOGO WMD.svg";

const FOOTER_LINKS = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "#product" },
      { label: "How it works", href: "#product" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    heading: "Community",
    links: [
      { label: "Reviews", href: "#community" },
      { label: "Blog", href: "#community" },
      { label: "Campus partners", href: "#" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Contact", href: "#contact" },
      { label: "Careers", href: "#" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy policy", href: "#" },
      { label: "Terms of service", href: "#" },
      { label: "Cookie policy", href: "#" },
    ],
  },
] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      aria-label="Site footer"
      className="relative overflow-hidden bg-[#1C1917]"
    >
      {/* Grain */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
          opacity: 0.04,
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1200px] px-5 py-16 lg:px-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_1.5fr]">
          {/* Brand column */}
          <div className="flex flex-col gap-4 sm:col-span-2 lg:order-last lg:col-span-1">
            <Image
              src={logoSrc}
              alt="Where's My Dorm"
              height={26}
              className="h-6.5 w-auto opacity-80 brightness-0 invert"
            />
            <p className="max-w-[28ch] text-[#6B6560] text-sm leading-relaxed">
              Student housing, simplified. Find, compare, and secure your dorm
              with confidence.
            </p>
            {/* Social icons */}
            <div
              className="mt-1 flex items-center gap-3"
              aria-label="Social media links"
            >
              {["twitter", "instagram", "linkedin"].map((platform) => (
                <a
                  key={platform}
                  href="#"
                  aria-label={`Follow us on ${platform}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#FDFBF7]/10 bg-[#FDFBF7]/05 text-[#6B6560] transition-colors duration-[180ms] hover:border-[#C4622D]/40 hover:text-[#C4622D] focus-visible:outline-2 focus-visible:outline-[#C4622D] focus-visible:outline-offset-2"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_LINKS.map((group) => (
            <div key={group.heading}>
              <h3 className="mb-4 font-semibold text-[#44403C] text-xs uppercase tracking-widest">
                {group.heading}
              </h3>
              <ul className="flex flex-col gap-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="rounded text-[#6B6560] text-sm transition-colors duration-[120ms] hover:text-[#C4622D] focus-visible:outline-2 focus-visible:outline-[#C4622D] focus-visible:outline-offset-2"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-3 border-[#FDFBF7]/08 border-t pt-6 text-[#44403C] text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {year} Where&rsquo;s My Dorm. All rights reserved.</p>
          <p>Made with care for students everywhere.</p>
        </div>
      </div>
    </footer>
  );
}
