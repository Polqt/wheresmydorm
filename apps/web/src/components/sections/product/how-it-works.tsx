"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    step: "01",
    title: "Create your profile",
    description:
      "Sign up with your student email, tell us your campus and move-in date, and set your budget and must-haves.",
    accent:
      "bg-gradient-to-br from-[rgb(91_111_209/0.12)] to-[rgb(181_202_255/0.35)] border-[rgb(91_111_209/0.25)]",
  },
  {
    step: "02",
    title: "Browse & shortlist",
    description:
      "Explore verified listings on the map or in list view. Save your favourites and compare side by side.",
    accent:
      "bg-gradient-to-br from-[rgb(245_158_11/0.12)] to-[rgb(255_237_213/0.9)] border-amber-200/70",
  },
  {
    step: "03",
    title: "Tour & sign",
    description:
      "Book a viewing in two taps, chat with the landlord, and sign your lease digitally — all without leaving the app.",
    accent:
      "bg-gradient-to-br from-[rgb(16_185_129/0.1)] to-[rgb(209_250_229/0.85)] border-emerald-200/70",
  },
] as const;

function StepBody({ s }: { s: (typeof STEPS)[number] }) {
  return (
    <>
      <span
        className="font-display text-4xl text-marketing-ink/25 tabular-nums leading-none mb-4 block"
        aria-label={`Step ${s.step}`}
      >
        {s.step}
      </span>
      <h3 className="text-marketing-ink font-semibold text-lg mb-2">{s.title}</h3>
      <p className="text-marketing-subhead text-sm leading-relaxed">{s.description}</p>
    </>
  );
}

export function HowItWorksStack() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="border-t border-marketing-border bg-gradient-to-b from-marketing-muted-bg/50 to-marketing-canvas">
      <div className="mx-auto max-w-[720px] px-5 lg:px-10 py-20 lg:py-28">
        <div className="mb-14 text-center">
          <span className="inline-flex items-center rounded-full border border-marketing-border bg-white/70 px-3.5 py-1 text-xs font-semibold text-marketing-brand mb-4">
            How it works
          </span>
          <h2 className="font-display text-[clamp(1.75rem,4vw,2.75rem)] text-marketing-ink tracking-tight leading-tight">
            Signed lease in three steps
          </h2>
          <p className="mt-4 text-marketing-subhead text-lg max-w-[50ch] mx-auto leading-relaxed font-medium">
            We cut out the confusion so you can go from browsing to moving in as quickly as possible.
          </p>
        </div>

        <ol className="relative flex flex-col gap-0" aria-label="How it works steps">
          {STEPS.map((s, i) => (
            <motion.li
              key={s.step}
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "relative rounded-2xl border bg-gradient-to-br p-8 shadow-[0_12px_40px_rgba(15,23,42,0.08)]",
                s.accent,
                i > 0 && "-mt-6 sm:-mt-8",
              )}
              style={{ zIndex: i + 1 }}
            >
              <StepBody s={s} />
            </motion.li>
          ))}
        </ol>
      </div>
    </div>
  );
}
