import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    title: "Smart search & filters",
    description:
      "Filter by distance to campus, rent range, amenities, lease type, and more — results update in real time.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Verified listings only",
    description:
      "Every listing is reviewed by our team for accuracy. No scams, no outdated availability, no surprises.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
      </svg>
    ),
    title: "Campus proximity map",
    description:
      "See every listing on an interactive map with walking, cycling, and transit times to your campus.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Roommate matching",
    description:
      "Answer a short lifestyle questionnaire and get matched with compatible roommates looking for the same space.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    title: "In-app scheduling",
    description:
      "Book tours and viewing appointments directly through the app — no back-and-forth emails required.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
    color: "text-[#5B6FD1]",
    bg: "bg-[#F5F7FF]",
    border: "border-[#B5CAFF]",
  },
  {
    step: "02",
    title: "Browse & shortlist",
    description:
      "Explore verified listings on the map or in list view. Save your favourites and compare side by side.",
    color: "text-[#EA580C]",
    bg: "bg-[#FFF7ED]",
    border: "border-[#FED7AA]",
  },
  {
    step: "03",
    title: "Tour & sign",
    description:
      "Book a viewing in two taps, chat with the landlord, and sign your lease digitally — all without leaving the app.",
    color: "text-[#0F766E]",
    bg: "bg-[#F0FDF4]",
    border: "border-[#86EFAC]",
  },
] as const;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#B5CAFF] bg-[#F5F7FF] px-3.5 py-1 text-xs font-semibold text-[#5B6FD1] mb-4">
      {children}
    </span>
  );
}

export function Product() {
  return (
    <section
      id="product"
      aria-labelledby="product-heading"
      className="scroll-mt-24 bg-white border-b border-[#E2E8F0]"
    >
      {/* Features subsection */}
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-24">
        <div className="mb-12 text-center">
          <SectionLabel>Features</SectionLabel>
          <h2
            id="product-heading"
            className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold text-[#0F172A] tracking-tight leading-tight"
          >
            Everything you need to find your dorm
          </h2>
          <p className="mt-4 text-[#475569] text-lg max-w-[54ch] mx-auto leading-relaxed">
            From first search to signed lease, Where&rsquo;s My Dorm handles every
            step of the housing journey for students.
          </p>
        </div>

        <ul
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          role="list"
          aria-label="Product features"
        >
          {FEATURES.map((feat) => (
            <li
              key={feat.title}
              className="flex flex-col gap-4 rounded-[20px] bg-[#F5F7FF] border border-[#E2E8F0] p-6 hover:shadow-[0_8px_24px_rgba(15,23,42,0.10)] transition-shadow duration-[180ms]"
            >
              <div className="w-11 h-11 rounded-[12px] bg-white border border-[#E2E8F0] shadow-[0_1px_2px_rgba(15,23,42,0.06)] flex items-center justify-center text-[#5B6FD1] shrink-0">
                {feat.icon}
              </div>
              <div>
                <h3 className="text-[#0F172A] font-semibold text-base mb-1.5">
                  {feat.title}
                </h3>
                <p className="text-[#475569] text-sm leading-relaxed">
                  {feat.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* How it works subsection */}
      <div className="bg-[#F5F7FF] border-t border-[#E2E8F0]">
        <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-24">
          <div className="mb-12 text-center">
            <SectionLabel>How it works</SectionLabel>
            <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold text-[#0F172A] tracking-tight leading-tight">
              Signed lease in three steps
            </h2>
            <p className="mt-4 text-[#475569] text-lg max-w-[50ch] mx-auto leading-relaxed">
              We cut out the confusion so you can go from browsing to moving in
              as quickly as possible.
            </p>
          </div>

          <ol
            className="grid gap-6 md:grid-cols-3"
            aria-label="How it works steps"
          >
            {STEPS.map((s) => (
              <li
                key={s.step}
                className={cn(
                  "relative flex flex-col gap-5 rounded-[20px] border p-8",
                  s.bg,
                  s.border,
                )}
              >
                <span
                  className={cn(
                    "text-4xl font-bold leading-none tabular-nums",
                    s.color,
                  )}
                  aria-label={`Step ${s.step}`}
                >
                  {s.step}
                </span>
                <div>
                  <h3 className="text-[#0F172A] font-semibold text-lg mb-2">
                    {s.title}
                  </h3>
                  <p className="text-[#475569] text-sm leading-relaxed">
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
