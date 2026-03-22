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
      width="16"
      height="16"
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
      className="scroll-mt-24 bg-white border-b border-[#E2E8F0]"
    >
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-24">
        <div className="mb-12 text-center">
          <span className="inline-flex items-center rounded-full border border-[#B5CAFF] bg-[#F5F7FF] px-3.5 py-1 text-xs font-semibold text-[#5B6FD1] mb-4">
            Pricing
          </span>
          <h2
            id="pricing-heading"
            className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold text-[#0F172A] tracking-tight leading-tight"
          >
            Simple, student-friendly pricing
          </h2>
          <p className="mt-4 text-[#475569] text-lg max-w-[50ch] mx-auto leading-relaxed">
            Start for free and upgrade only when you&rsquo;re ready. No hidden
            fees, no long-term contracts.
          </p>
        </div>

        <div
          className="grid gap-6 md:grid-cols-3 items-stretch"
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
                  ? "bg-[#0F172A] text-white border-[#5B6FD1] border-2 shadow-[0_16px_40px_rgba(15,23,42,0.14)]"
                  : "bg-white border-[#E2E8F0] shadow-[0_8px_24px_rgba(15,23,42,0.10)]",
              )}
            >
              {plan.featured && plan.badge && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-[#5B6FD1] px-4 py-1 text-xs font-semibold text-white shadow-[0_6px_20px_rgba(91,111,209,0.35)]">
                  {plan.badge}
                </span>
              )}

              <div className="mb-6">
                <h3
                  className={cn(
                    "text-lg font-semibold mb-1",
                    plan.featured ? "text-white" : "text-[#0F172A]",
                  )}
                >
                  {plan.name}
                </h3>
                <div className="flex items-end gap-1.5 mb-3">
                  <span
                    className={cn(
                      "text-4xl font-bold tracking-tight tabular-nums",
                      plan.featured ? "text-white" : "text-[#0F172A]",
                    )}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={cn(
                      "text-sm pb-1",
                      plan.featured ? "text-[#94A3B8]" : "text-[#64748B]",
                    )}
                  >
                    /{plan.period}
                  </span>
                </div>
                <p
                  className={cn(
                    "text-sm leading-relaxed",
                    plan.featured ? "text-[#94A3B8]" : "text-[#475569]",
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
                      plan.featured ? "text-[#CBD5E1]" : "text-[#475569]",
                    )}
                  >
                    <span
                      className={
                        plan.featured ? "text-[#829AFF]" : "text-[#5B6FD1]"
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
                  "inline-flex items-center justify-center h-11 rounded-full font-medium text-sm transition-colors duration-[180ms] focus-visible:outline-2 focus-visible:outline-[#5B6FD1] focus-visible:outline-offset-2 active:scale-[0.98]",
                  plan.featured
                    ? "bg-[#5B6FD1] text-white hover:bg-[#3746A3] shadow-[0_6px_20px_rgba(91,111,209,0.35)]"
                    : "border border-[#CBD5E1] bg-white text-[#0F172A] hover:bg-[#F8FAFC] hover:border-[#94A3B8]",
                )}
                aria-label={`${plan.cta} — ${plan.name} plan`}
              >
                {plan.cta}
              </a>
            </article>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-[#64748B]">
          All plans include a 14-day free trial. No credit card required.
        </p>
      </div>
    </section>
  );
}
