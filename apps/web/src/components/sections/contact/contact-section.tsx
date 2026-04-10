"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const TOPICS = [
  "General enquiry",
  "Listing issue or report",
  "Account & billing",
  "Partnerships",
  "Press & media",
  "Other",
] as const;

const fieldClass =
  "h-11 w-full rounded-xl border border-marketing-border bg-white px-4 text-sm text-marketing-ink placeholder:text-marketing-subhead/70 transition-colors duration-150 focus:outline-none focus:border-marketing-brand focus:ring-2 focus:ring-marketing-brand/25";

export function Contact() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="scroll-mt-24 border-b border-marketing-border bg-marketing-card"
    >
      <div className="mx-auto max-w-[1100px] px-5 lg:px-10 py-20 lg:py-24">
        <div
          className="overflow-hidden rounded-3xl border border-marketing-border bg-marketing-card shadow-[0_24px_64px_rgba(15,23,42,0.08)] grid lg:grid-cols-12"
        >
          <div className="lg:col-span-5 relative p-10 lg:p-12 flex flex-col justify-between gap-10 bg-gradient-to-br from-marketing-ink via-[#1e293b] to-marketing-brand/30 text-white">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_50%)]"
            />
            <div className="relative">
              <span className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3.5 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm mb-6">
                Contact
              </span>
              <h2
                id="contact-heading"
                className="font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-tight tracking-tight text-white mb-4"
              >
                Let&rsquo;s start a conversation
              </h2>
              <p className="text-white/75 text-base leading-relaxed max-w-[36ch] font-medium">
                Have a question, a listing issue, or a partnership idea? We typically
                reply within one business day.
              </p>
            </div>

            <ul className="relative flex flex-col gap-6" aria-label="Contact details">
              {[
                {
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  ),
                  label: "Email",
                  value: "hello@wheresmydorm.app",
                },
                {
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                  ),
                  label: "Response time",
                  value: "Within 1 business day",
                },
              ].map((item) => (
                <li key={item.label} className="flex items-center gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur-sm">
                    {item.icon}
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/55">
                      {item.label}
                    </p>
                    <p className="text-sm font-medium text-white">{item.value}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-7 p-8 sm:p-10 lg:p-12 bg-marketing-canvas/50">
            <div className="rounded-2xl border border-marketing-border bg-marketing-card p-6 sm:p-8 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-14 text-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h3 className="font-display text-xl text-marketing-ink">Message sent!</h3>
                  <p className="text-marketing-subhead text-sm max-w-[32ch] font-medium">
                    Thanks for reaching out. We&rsquo;ll get back to you within one business day.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="mt-2 text-sm font-semibold text-marketing-brand hover:text-marketing-brand-hover transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#5b6fd1] focus-visible:outline-offset-2 rounded-lg"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  noValidate
                  aria-label="Contact form"
                  className="flex flex-col gap-5"
                >
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="contact-name" className="text-sm font-semibold text-marketing-ink">
                        Name <span className="text-red-500" aria-label="required">*</span>
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        name="name"
                        required
                        autoComplete="name"
                        placeholder="Your full name"
                        className={fieldClass}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="contact-email" className="text-sm font-semibold text-marketing-ink">
                        Email <span className="text-red-500" aria-label="required">*</span>
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        name="email"
                        required
                        autoComplete="email"
                        placeholder="you@university.edu"
                        className={fieldClass}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="contact-topic" className="text-sm font-semibold text-marketing-ink">
                      Topic <span className="text-red-500" aria-label="required">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="contact-topic"
                        name="topic"
                        required
                        defaultValue=""
                        className={cn(fieldClass, "appearance-none pr-10")}
                      >
                        <option value="" disabled>
                          Select a topic
                        </option>
                        {TOPICS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <svg
                        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-marketing-subhead"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="contact-message" className="text-sm font-semibold text-marketing-ink">
                      Message <span className="text-red-500" aria-label="required">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      required
                      rows={5}
                      placeholder="How can we help you?"
                      className="resize-none rounded-xl border border-marketing-border bg-white px-4 py-3 text-sm text-marketing-ink placeholder:text-marketing-subhead/70 transition-colors duration-150 focus:outline-none focus:border-marketing-brand focus:ring-2 focus:ring-marketing-brand/25"
                    />
                  </div>

                  <button
                    type="submit"
                    className="mt-1 inline-flex items-center justify-center h-12 rounded-full bg-marketing-ink text-white text-sm font-semibold hover:bg-marketing-ink/90 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-[#5b6fd1] focus-visible:outline-offset-2 active:scale-[0.98]"
                  >
                    Send message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
