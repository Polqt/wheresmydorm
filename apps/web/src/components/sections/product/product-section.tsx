const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    title: "Smart search & filters",
    description:
      "Filter by distance to campus, rent range, amenities, lease type, and more — results update in real time.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Verified listings only",
    description:
      "Every listing is reviewed by our team for accuracy. No scams, no outdated availability, no surprises.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
      </svg>
    ),
    title: "Campus proximity map",
    description:
      "See every listing on an interactive map with walking, cycling, and transit times to your campus.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Roommate matching",
    description:
      "Answer a short lifestyle questionnaire and get matched with compatible roommates looking for the same space.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    title: "In-app scheduling",
    description:
      "Book tours and viewing appointments directly through the app — no back-and-forth emails required.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: "Instant messaging",
    description:
      "Chat with landlords and property managers directly in the app. Keep all your conversations in one place.",
  },
] as const;

const STEPS = [
  {
    step: "01",
    title: "Create your profile",
    description:
      "Sign up with your student email, tell us your campus and move-in date, and set your budget and must-haves.",
    accent: "#C4622D",
    bg: "#FFF5EE",
    border: "#F4A67A",
  },
  {
    step: "02",
    title: "Browse & shortlist",
    description:
      "Explore verified listings on the map or in list view. Save your favourites and compare side by side.",
    accent: "#1A3A2A",
    bg: "#F0F7F2",
    border: "#86C4A0",
  },
  {
    step: "03",
    title: "Tour & sign",
    description:
      "Book a viewing in two taps, chat with the landlord, and sign your lease digitally — all without leaving the app.",
    accent: "#B07D00",
    bg: "#FDF8EC",
    border: "#E8C94A",
  },
] as const;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#C4622D]/30 bg-[#C4622D]/08 px-3.5 py-1 text-xs font-semibold text-[#C4622D] mb-4 tracking-wide uppercase">
      {children}
    </span>
  );
}

export function Product() {
  return (
    <section
      id="product"
      aria-labelledby="product-heading"
      className="scroll-mt-24 bg-[#FDFBF7]"
    >
      {/* Features subsection */}
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-28">
        <div className="mb-14">
          <SectionLabel>Features</SectionLabel>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <h2
              id="product-heading"
              className="text-[#1C1917] tracking-[-0.02em] leading-tight max-w-[18ch]"
              style={{
                fontFamily: "var(--font-dm-serif)",
                fontSize: "clamp(1.9rem, 4vw, 3rem)",
              }}
            >
              Everything you need to find your home
            </h2>
            <p className="text-[#78716C] text-base leading-relaxed max-w-[40ch] lg:text-right">
              From first search to signed lease, Where&rsquo;s My Dorm handles
              every step of the housing journey.
            </p>
          </div>
        </div>

        {/* Feature grid — first row spans differently */}
        <ul
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          role="list"
          aria-label="Product features"
        >
          {FEATURES.map((feat, i) => (
            <li
              key={feat.title}
              className={
                i === 0
                  ? "sm:col-span-2 lg:col-span-1 flex flex-col gap-4 rounded-[20px] bg-white border border-[#E8E0D5] p-7 hover:shadow-[0_12px_32px_rgba(28,25,23,0.08)] hover:-translate-y-0.5 transition-all duration-[220ms]"
                  : "flex flex-col gap-4 rounded-[20px] bg-white border border-[#E8E0D5] p-7 hover:shadow-[0_12px_32px_rgba(28,25,23,0.08)] hover:-translate-y-0.5 transition-all duration-[220ms]"
              }
            >
              <div className="w-11 h-11 rounded-[12px] bg-[#FFF5EE] border border-[#F4A67A]/30 flex items-center justify-center text-[#C4622D] shrink-0">
                {feat.icon}
              </div>
              <div>
                <h3 className="text-[#1C1917] font-semibold text-base mb-1.5">
                  {feat.title}
                </h3>
                <p className="text-[#78716C] text-sm leading-relaxed">
                  {feat.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* How it works — dark strip */}
      <div className="bg-[#1C1917] relative overflow-hidden">
        {/* Diagonal top edge */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 right-0 h-16 bg-[#FDFBF7]"
          style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
        />
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

        <div className="relative z-10 mx-auto max-w-[1200px] px-5 lg:px-10 pt-24 pb-20 lg:pt-28 lg:pb-24">
          <div className="mb-14 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <span className="inline-flex items-center rounded-full border border-[#C4622D]/40 bg-[#C4622D]/10 px-3.5 py-1 text-xs font-semibold text-[#F4A67A] mb-4 tracking-wide uppercase">
                How it works
              </span>
              <h2
                className="text-[#FDFBF7] tracking-[-0.02em] leading-tight"
                style={{
                  fontFamily: "var(--font-dm-serif)",
                  fontSize: "clamp(1.9rem, 4vw, 3rem)",
                }}
              >
                Signed lease in three steps
              </h2>
            </div>
            <p className="text-[#78716C] text-base leading-relaxed max-w-[36ch] lg:text-right">
              We cut out the confusion so you can go from browsing to moving in
              as quickly as possible.
            </p>
          </div>

          <ol
            className="grid gap-5 md:grid-cols-3"
            aria-label="How it works steps"
          >
            {STEPS.map((s) => (
              <li
                key={s.step}
                className="relative flex flex-col gap-5 rounded-[20px] p-8"
                style={{
                  backgroundColor: s.bg,
                  border: `1px solid ${s.border}40`,
                }}
              >
                <span
                  className="text-5xl font-bold leading-none tabular-nums"
                  style={{
                    fontFamily: "var(--font-dm-serif)",
                    color: s.accent,
                    opacity: 0.9,
                  }}
                  aria-label={`Step ${s.step}`}
                >
                  {s.step}
                </span>
                <div>
                  <h3 className="text-[#1C1917] font-semibold text-lg mb-2">
                    {s.title}
                  </h3>
                  <p className="text-[#44403C] text-sm leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
