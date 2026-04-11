import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Everything you need to start your housing search.",
    cta: "Get started free",
    ctaVariant: "outline" as const,
    featured: false,
    features: [
      "Up to 10 saved listings",
      "Campus proximity map",
      "Basic filters (rent, distance)",
      "In-app messaging (5/month)",
      "Community forum access",
    ],
  },
  {
    name: "Student",
    price: "$4",
    period: "per month",
    description: "The full experience for serious house-hunters.",
    cta: "Start free trial",
    ctaVariant: "brand" as const,
    featured: true,
    badge: "Most popular",
    features: [
      "Unlimited saved listings",
      "Advanced filters + roommate match",
      "Priority listing alerts",
      "Unlimited in-app messaging",
      "Tour scheduling in-app",
      "Verified badge on your profile",
    ],
  },
  {
    name: "Pro",
    price: "$12",
    period: "per month",
    description: "For students managing multiple applications at once.",
    cta: "Get Pro",
    ctaVariant: "outline" as const,
    featured: false,
    features: [
      "Everything in Student",
      "Digital lease signing",
      "Document storage (5 GB)",
      "Priority customer support",
      "Rent payment reminders",
      "Early access to new features",
    ],
  },
] as const;

function CheckIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0 mt-0.5"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function Pricing() {
  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="scroll-mt-24 bg-[#FDFBF7] border-t border-[#E8E0D5]"
    >
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-28">
        <div className="mb-14">
          <span className="inline-flex items-center rounded-full border border-[#C4622D]/30 bg-[#C4622D]/08 px-3.5 py-1 text-xs font-semibold text-[#C4622D] mb-4 tracking-wide uppercase">
            Pricing
          </span>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <h2
              id="pricing-heading"
              className="text-[#1C1917] tracking-[-0.02em] leading-tight"
              style={{
                fontFamily: "var(--font-dm-serif)",
                fontSize: "clamp(1.9rem, 4vw, 3rem)",
              }}
            >
              Simple, student-friendly pricing
            </h2>
            <p className="text-[#78716C] text-base leading-relaxed max-w-[40ch] lg:text-right">
              Start for free and upgrade only when you&rsquo;re ready. No hidden
              fees, no long-term contracts.
            </p>
          </div>
        </div>

        <div
          className="grid gap-5 md:grid-cols-3 items-stretch"
          role="list"
          aria-label="Pricing plans"
        >
          {PLANS.map((plan) => (
            <article
              key={plan.name}
              role="listitem"
              aria-label={`${plan.name} plan`}
              className={cn(
                "relative flex flex-col rounded-[20px] border p-8",
                plan.featured
                  ? "text-white border-[#2D5A42]"
                  : "bg-white border-[#E8E0D5] shadow-[0_4px_16px_rgba(28,25,23,0.06)]",
              )}
              style={
                plan.featured
                  ? { backgroundColor: "#1A3A2A" }
                  : undefined
              }
            >
              {plan.featured && plan.badge && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-[#C4622D] px-4 py-1 text-xs font-semibold text-white shadow-[0_4px_14px_rgba(196,98,45,0.4)]">
                  {plan.badge}
                </span>
              )}

              <div className="mb-6">
                <h3
                  className={cn(
                    "text-sm font-semibold mb-1 uppercase tracking-widest",
                    plan.featured ? "text-[#86C4A0]" : "text-[#78716C]",
                  )}
                >
                  {plan.name}
                </h3>
                <div className="flex items-end gap-1.5 mb-3">
                  <span
                    className={cn(
                      "text-5xl font-bold tracking-tight tabular-nums",
                      plan.featured ? "text-[#FDFBF7]" : "text-[#1C1917]",
                    )}
                    style={{ fontFamily: "var(--font-dm-serif)" }}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={cn(
                      "text-sm pb-1.5",
                      plan.featured ? "text-[#86C4A0]" : "text-[#78716C]",
                    )}
                  >
                    /{plan.period}
                  </span>
                </div>
                <p
                  className={cn(
                    "text-sm leading-relaxed",
                    plan.featured ? "text-[#86C4A0]" : "text-[#78716C]",
                  )}
                >
                  {plan.description}
                </p>
              </div>

              <ul
                className="flex flex-col gap-3 mb-8 grow"
                aria-label={`${plan.name} plan features`}
              >
                {plan.features.map((feat) => (
                  <li
                    key={feat}
                    className={cn(
                      "flex items-start gap-2.5 text-sm",
                      plan.featured ? "text-[#C5DDD0]" : "text-[#44403C]",
                    )}
                  >
                    <span
                      className={
                        plan.featured ? "text-[#6DB88E]" : "text-[#C4622D]"
                      }
                    >
                      <CheckIcon />
                    </span>
                    {feat}
                  </li>
                ))}
              </ul>

              <a
                href="#"
                className={cn(
                  "inline-flex items-center justify-center h-11 rounded-full font-medium text-sm transition-colors duration-[180ms] focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98]",
                  plan.featured
                    ? "bg-[#C4622D] text-white hover:bg-[#A84E23] shadow-[0_4px_14px_rgba(196,98,45,0.4)] focus-visible:outline-[#F4A67A]"
                    : "border border-[#D6C5B0] bg-transparent text-[#1C1917] hover:bg-[#F5EFE6] hover:border-[#C4622D]/40 focus-visible:outline-[#C4622D]",
                )}
                aria-label={`${plan.cta} — ${plan.name} plan`}
              >
                {plan.cta}
              </a>
            </article>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-[#78716C]">
          All plans include a 14-day free trial. No credit card required.
        </p>
      </div>
    </section>
  );
}
