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

function BentoCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-marketing-border bg-marketing-card p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-shadow duration-200 hover:shadow-[0_16px_48px_rgba(15,23,42,0.1)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FeaturesBento() {
  const [a, b, c, d, e, f] = FEATURES;

  return (
    <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-24">
      <div className="mb-12 text-center">
        <span className="inline-flex items-center rounded-full border border-marketing-border bg-white/70 px-3.5 py-1 text-xs font-semibold text-marketing-brand mb-4">
          Features
        </span>
        <h2
          id="product-heading"
          className="font-display text-[clamp(1.75rem,4vw,2.75rem)] text-marketing-ink tracking-tight leading-tight"
        >
          Everything you need to find your dorm
        </h2>
        <p className="mt-4 text-marketing-subhead text-lg max-w-[54ch] mx-auto leading-relaxed font-medium">
          From first search to signed lease, Where&rsquo;s My Dorm handles every step
          of the housing journey for students.
        </p>
      </div>

      <div
        className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:grid-rows-[auto_auto_auto] auto-rows-min"
        role="list"
        aria-label="Product features"
      >
        <BentoCard className="lg:col-span-2 lg:row-span-2 lg:min-h-[280px] justify-center">
          <div className="flex flex-col gap-4 h-full justify-center">
            <div className="w-12 h-12 rounded-xl bg-marketing-brand-soft/40 border border-marketing-border flex items-center justify-center text-marketing-brand shrink-0">
              {a.icon}
            </div>
            <div>
              <h3 className="text-marketing-ink font-semibold text-xl mb-2">{a.title}</h3>
              <p className="text-marketing-subhead text-sm leading-relaxed max-w-prose">
                {a.description}
              </p>
            </div>
          </div>
        </BentoCard>

        <BentoCard className="lg:col-start-3 lg:row-start-1">
          <div className="w-11 h-11 rounded-xl bg-marketing-muted-bg border border-marketing-border flex items-center justify-center text-marketing-brand shrink-0">
            {b.icon}
          </div>
          <div>
            <h3 className="text-marketing-ink font-semibold text-base mb-1.5">{b.title}</h3>
            <p className="text-marketing-subhead text-sm leading-relaxed">{b.description}</p>
          </div>
        </BentoCard>

        <BentoCard className="lg:col-start-3 lg:row-start-2">
          <div className="w-11 h-11 rounded-xl bg-marketing-muted-bg border border-marketing-border flex items-center justify-center text-marketing-brand shrink-0">
            {c.icon}
          </div>
          <div>
            <h3 className="text-marketing-ink font-semibold text-base mb-1.5">{c.title}</h3>
            <p className="text-marketing-subhead text-sm leading-relaxed">{c.description}</p>
          </div>
        </BentoCard>

        {[d, e, f].map((feat) => (
          <BentoCard key={feat.title}>
            <div className="w-11 h-11 rounded-xl bg-marketing-muted-bg border border-marketing-border flex items-center justify-center text-marketing-brand shrink-0">
              {feat.icon}
            </div>
            <div>
              <h3 className="text-marketing-ink font-semibold text-base mb-1.5">{feat.title}</h3>
              <p className="text-marketing-subhead text-sm leading-relaxed">{feat.description}</p>
            </div>
          </BentoCard>
        ))}
      </div>
    </div>
  );
}
