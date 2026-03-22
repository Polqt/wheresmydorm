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
      className="bg-[#F5F7FF] border-t border-[#E2E8F0]"
    >
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_1.5fr]">
          {/* Brand column */}
          <div className="lg:col-span-1 sm:col-span-2 lg:order-last flex flex-col gap-4">
            <Image
              src={logoSrc}
              alt="Where's My Dorm"
              height={26}
              className="h-6.5 w-auto"
            />
            <p className="text-sm text-[#64748B] leading-relaxed max-w-[28ch]">
              Student housing, simplified. Find, compare, and secure your dorm
              with confidence.
            </p>
            {/* Social icons placeholder */}
            <div className="flex items-center gap-3 mt-1" aria-label="Social media links">
              {["twitter", "instagram", "linkedin"].map((platform) => (
                <a
                  key={platform}
                  href="#"
                  aria-label={`Follow us on ${platform}`}
                  className="w-8 h-8 rounded-full border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:text-[#5B6FD1] hover:border-[#B5CAFF] transition-colors duration-[180ms] focus-visible:outline-2 focus-visible:outline-[#5B6FD1] focus-visible:outline-offset-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_LINKS.map((group) => (
            <div key={group.heading}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[#94A3B8] mb-4">
                {group.heading}
              </h3>
              <ul className="flex flex-col gap-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-[#475569] hover:text-[#0F172A] transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-[#5B6FD1] focus-visible:outline-offset-2 rounded"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[#94A3B8]">
          <p>&copy; {year} Where&rsquo;s My Dorm. All rights reserved.</p>
          <p>Made with care for students everywhere.</p>
        </div>
      </div>
    </footer>
  );
}
