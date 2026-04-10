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
      className="border-t border-marketing-border bg-marketing-muted-bg/60"
    >
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.2fr_repeat(4,minmax(0,1fr))] lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-1 flex flex-col gap-5">
            <Image
              src={logoSrc}
              alt="Where's My Dorm"
              height={28}
              className="h-7 w-auto"
            />
            <p className="text-sm text-marketing-subhead leading-relaxed max-w-[32ch] font-medium">
              Student housing, simplified. Find, compare, and secure your dorm with
              confidence.
            </p>
            <div className="flex items-center gap-2 pt-1" aria-label="Social media links">
              {["twitter", "instagram", "linkedin"].map((platform) => (
                <a
                  key={platform}
                  href="#"
                  aria-label={`Follow us on ${platform}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-marketing-border bg-marketing-card text-marketing-subhead transition-colors duration-200 hover:border-marketing-brand hover:text-marketing-brand focus-visible:outline-2 focus-visible:outline-[#5b6fd1] focus-visible:outline-offset-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {FOOTER_LINKS.map((group) => (
            <div key={group.heading}>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-marketing-subhead mb-5">
                {group.heading}
              </h3>
              <ul className="flex flex-col gap-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm font-medium text-marketing-ink/80 hover:text-marketing-brand transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#5b6fd1] focus-visible:outline-offset-2 rounded"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-marketing-border pt-8 text-xs text-marketing-subhead font-medium sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {year} Where&rsquo;s My Dorm. All rights reserved.</p>
          <p>Made with care for students everywhere.</p>
        </div>
      </div>
    </footer>
  );
}
