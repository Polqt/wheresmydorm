import { cn } from "@/lib/utils";
import { LiquidGlassPillLink } from "@/components/ui/liquid-glass-pill";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Everything you need to start your housing search.",
    cta: "Get started free",
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

function CheckIcon({ className }: { className?: string }) {
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
      className={cn("shrink-0 mt-0.5", className)}
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
      className="scroll-mt-24 border-b border-marketing-border bg-marketing-canvas"
    >
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-24">
        <div className="mb-14 text-center">
          <span className="inline-flex items-center rounded-full border border-marketing-border bg-white/70 px-3.5 py-1 text-xs font-semibold text-marketing-brand mb-4">
            Pricing
          </span>
          <h2
            id="pricing-heading"
            className="font-display text-[clamp(1.75rem,4vw,2.75rem)] text-marketing-ink tracking-tight leading-tight"
          >
            Simple, student-friendly pricing
          </h2>
          <p className="mt-4 text-marketing-subhead text-lg max-w-[50ch] mx-auto leading-relaxed font-medium">
            Start for free and upgrade only when you&rsquo;re ready. No hidden fees,
            no long-term contracts.
          </p>
        </div>

        <div
          className="grid gap-6 md:grid-cols-3 items-stretch md:items-end"
          role="list"
          aria-label="Pricing plans"
        >
          {PLANS.map((plan) => (
            <article
              key={plan.name}
              role="listitem"
              aria-label={`${plan.name} plan`}
              className={cn(
                "relative flex flex-col rounded-3xl border p-8 transition-transform duration-300",
                plan.featured
                  ? "bg-marketing-ink text-white border-marketing-brand/50 shadow-[0_24px_64px_rgba(15,23,42,0.2)] md:scale-[1.04] md:z-10 md:-my-2"
                  : "bg-marketing-card text-marketing-ink border-marketing-border shadow-[0_12px_40px_rgba(15,23,42,0.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,0.1)]",
              )}
            >
              {plan.featured && plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-marketing-brand px-4 py-1 text-xs font-semibold text-white shadow-lg">
                  {plan.badge}
                </span>
              )}

              <div className="mb-6 pt-1">
                <h3
                  className={cn(
                    "text-lg font-semibold mb-1",
                    plan.featured ? "text-white" : "text-marketing-ink",
                  )}
                >
                  {plan.name}
                </h3>
                <div className="flex items-end gap-1.5 mb-3">
                  <span
                    className={cn(
                      "font-display text-4xl tracking-tight tabular-nums",
                      plan.featured ? "text-white" : "text-marketing-ink",
                    )}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={cn(
                      "text-sm pb-1 font-medium",
                      plan.featured ? "text-white/60" : "text-marketing-subhead",
                    )}
                  >
                    /{plan.period}
                  </span>
                </div>
                <p
                  className={cn(
                    "text-sm leading-relaxed",
                    plan.featured ? "text-white/70" : "text-marketing-subhead",
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
                      plan.featured ? "text-white/85" : "text-marketing-subhead",
                    )}
                  >
                    <span
                      className={plan.featured ? "text-marketing-brand-soft" : "text-marketing-brand"}
                    >
                      <CheckIcon />
                    </span>
                    {feat}
                  </li>
                ))}
              </ul>

              {plan.featured ? (
                <a
                  href="#"
                  className="inline-flex items-center justify-center h-12 rounded-full font-semibold text-sm bg-marketing-brand text-white hover:bg-marketing-brand-hover transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 active:scale-[0.98]"
                  aria-label={`${plan.cta} — ${plan.name} plan`}
                >
                  {plan.cta}
                </a>
              ) : (
                <LiquidGlassPillLink
                  href="#"
                  className="w-full font-semibold !rounded-full justify-center"
                  aria-label={`${plan.cta} — ${plan.name} plan`}
                >
                  {plan.cta}
                </LiquidGlassPillLink>
              )}
            </article>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-marketing-subhead font-medium">
          All plans include a 14-day free trial. No credit card required.
        </p>
      </div>
    </section>
  );
}
