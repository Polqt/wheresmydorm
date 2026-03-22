"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    question: "Is Where's My Dorm free to use?",
    answer:
      "Yes — our Free plan gives you access to listings, the campus map, and basic filters at no cost, forever. You can upgrade to our Student or Pro plan to unlock advanced features like roommate matching, unlimited messaging, and in-app tour scheduling.",
  },
  {
    question: "How are listings verified?",
    answer:
      "Every property on our platform goes through a manual review process. Our team checks ownership documents, photos, and availability before a listing goes live. We also remove listings that receive consistent negative feedback from users.",
  },
  {
    question: "Can I use the app if I'm an international student?",
    answer:
      "Absolutely. Where's My Dorm is built with international students in mind. You can search by campus, browse listings remotely before you arrive, and message landlords to arrange virtual tours — all in one place.",
  },
  {
    question: "How does roommate matching work?",
    answer:
      "When you sign up or update your profile, you'll fill in a short lifestyle questionnaire covering things like sleep schedule, study habits, noise tolerance, and cleanliness preferences. Our algorithm then surfaces other students with high compatibility scores who are looking for a co-tenant.",
  },
  {
    question: "What happens if a landlord is unresponsive or fraudulent?",
    answer:
      "You can report any listing or conversation directly from the app. Our Trust & Safety team reviews reports within 24 hours and will suspend accounts that violate our policies. If you believe you've encountered a scam, contact our support team immediately and we'll guide you through next steps.",
  },
  {
    question: "Can I cancel my subscription at any time?",
    answer:
      "Yes. You can cancel your paid subscription at any time from your account settings. Your plan remains active until the end of the current billing period, after which you'll automatically move to the Free plan — with no data loss.",
  },
] as const;

function FaqItem({
  question,
  answer,
  index,
}: {
  question: string;
  answer: string;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const id = `faq-${index}`;
  const panelId = `faq-panel-${index}`;

  return (
    <div className="rounded-[16px] bg-white border border-[#E2E8F0] overflow-hidden">
      <h3>
        <button
          id={id}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-4 px-6 text-left text-[#0F172A] font-semibold text-base transition-colors duration-[120ms] hover:text-[#5B6FD1] focus-visible:outline-2 focus-visible:outline-[#5B6FD1] focus-visible:outline-offset-[-2px] min-h-[52px] py-4"
        >
          <span>{question}</span>
          <span
            className={cn(
              "shrink-0 w-7 h-7 rounded-full border border-[#E2E8F0] bg-[#F5F7FF] flex items-center justify-center text-[#5B6FD1] transition-transform duration-[180ms]",
              open && "rotate-45",
            )}
            aria-hidden="true"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </span>
        </button>
      </h3>

      <div
        id={panelId}
        role="region"
        aria-labelledby={id}
        hidden={!open}
        className={cn(
          "overflow-hidden transition-all duration-[180ms]",
          open ? "max-h-[480px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <p className="px-6 pb-5 text-sm text-[#475569] leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
}

export function Faq() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="scroll-mt-24 bg-[#F5F7FF] border-b border-[#E2E8F0]"
    >
      <div className="mx-auto max-w-[800px] px-5 lg:px-10 py-20 lg:py-24">
        <div className="mb-12 text-center">
          <span className="inline-flex items-center rounded-full border border-[#B5CAFF] bg-white px-3.5 py-1 text-xs font-semibold text-[#5B6FD1] mb-4">
            FAQs
          </span>
          <h2
            id="faq-heading"
            className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold text-[#0F172A] tracking-tight leading-tight"
          >
            Frequently asked questions
          </h2>
          <p className="mt-4 text-[#475569] text-lg leading-relaxed">
            Can&rsquo;t find what you&rsquo;re looking for?{" "}
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-[#5B6FD1] font-medium underline underline-offset-2 hover:text-[#3746A3] transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-[#5B6FD1] focus-visible:outline-offset-2 rounded"
            >
              Contact us
            </a>
            .
          </p>
        </div>

        <div className="flex flex-col gap-3" role="list">
          {FAQS.map((item, i) => (
            <div key={item.question} role="listitem">
              <FaqItem question={item.question} answer={item.answer} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
