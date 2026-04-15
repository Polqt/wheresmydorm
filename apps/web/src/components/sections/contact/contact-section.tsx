"use client";

import { useState } from "react";

const TOPICS = [
  "General enquiry",
  "Listing issue or report",
  "Account & billing",
  "Partnerships",
  "Press & media",
  "Other",
] as const;

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
      className="scroll-mt-24 border-[#E8E0D5] border-t bg-[#FDFBF7]"
    >
      <div className="mx-auto max-w-[1200px] px-5 py-20 lg:px-10 lg:py-28">
        <div className="grid items-start gap-14 lg:grid-cols-2">
          {/* Left copy */}
          <div className="lg:sticky lg:top-32">
            <span className="mb-4 inline-flex items-center rounded-full border border-[#C4622D]/30 bg-[#C4622D]/08 px-3.5 py-1 font-semibold text-[#C4622D] text-xs uppercase tracking-wide">
              Contact
            </span>
            <h2
              id="contact-heading"
              className="mb-5 text-[#1C1917] leading-tight tracking-[-0.02em]"
              style={{
                fontFamily: "var(--font-dm-serif)",
                fontSize: "clamp(1.9rem, 4vw, 3rem)",
              }}
            >
              Get in touch
            </h2>
            <p className="mb-10 max-w-[42ch] text-[#78716C] text-base leading-relaxed">
              Have a question, a listing issue, or a partnership idea?
              We&rsquo;d love to hear from you. Our team typically replies
              within one business day.
            </p>

            <ul className="flex flex-col gap-5" aria-label="Contact details">
              {[
                {
                  icon: (
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  ),
                  label: "Email",
                  value: "hello@wheresmydorm.app",
                },
                {
                  icon: (
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  ),
                  label: "Response time",
                  value: "Within 1 business day",
                },
              ].map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-3 text-[#44403C] text-sm"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-[#F4A67A]/30 bg-[#FFF5EE] text-[#C4622D]">
                    {item.icon}
                  </span>
                  <div>
                    <p className="font-medium text-[#78716C] text-xs">
                      {item.label}
                    </p>
                    <p className="font-medium text-[#1C1917]">{item.value}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Form card */}
          <div className="rounded-[20px] border border-[#E8E0D5] bg-white p-8 shadow-[0_8px_32px_rgba(28,25,23,0.08)]">
            {submitted ? (
              <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#86C4A0] bg-[#F0F7F2]">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#1A3A2A"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3
                  className="text-2xl text-[#1C1917]"
                  style={{ fontFamily: "var(--font-dm-serif)" }}
                >
                  Message sent!
                </h3>
                <p className="max-w-[32ch] text-[#78716C] text-sm">
                  Thanks for reaching out. We&rsquo;ll get back to you within
                  one business day.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-2 rounded font-medium text-[#C4622D] text-sm transition-colors duration-[120ms] hover:text-[#A84E23] focus-visible:outline-2 focus-visible:outline-[#C4622D] focus-visible:outline-offset-2"
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
                <div className="grid gap-5 sm:grid-cols-2">
                  {/* Name */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="contact-name"
                      className="font-medium text-[#1C1917] text-sm"
                    >
                      Name{" "}
                      <span className="text-[#C4622D]" aria-label="required">
                        *
                      </span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      name="name"
                      required
                      autoComplete="name"
                      placeholder="Your full name"
                      className="h-11 rounded-[12px] border border-[#D6C5B0] bg-white px-4 text-[#1C1917] text-sm placeholder-[#A8A29E] transition-colors duration-[120ms] focus:border-[#C4622D] focus:outline-none focus:ring-2 focus:ring-[#C4622D]/20"
                    />
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="contact-email"
                      className="font-medium text-[#1C1917] text-sm"
                    >
                      Email{" "}
                      <span className="text-[#C4622D]" aria-label="required">
                        *
                      </span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      name="email"
                      required
                      autoComplete="email"
                      placeholder="you@university.edu"
                      className="h-11 rounded-[12px] border border-[#D6C5B0] bg-white px-4 text-[#1C1917] text-sm placeholder-[#A8A29E] transition-colors duration-[120ms] focus:border-[#C4622D] focus:outline-none focus:ring-2 focus:ring-[#C4622D]/20"
                    />
                  </div>
                </div>

                {/* Topic */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="contact-topic"
                    className="font-medium text-[#1C1917] text-sm"
                  >
                    Topic{" "}
                    <span className="text-[#C4622D]" aria-label="required">
                      *
                    </span>
                  </label>
                  <div className="relative">
                    <select
                      id="contact-topic"
                      name="topic"
                      required
                      defaultValue=""
                      className="h-11 w-full appearance-none rounded-[12px] border border-[#D6C5B0] bg-white pr-10 pl-4 text-[#1C1917] text-sm transition-colors duration-[120ms] focus:border-[#C4622D] focus:outline-none focus:ring-2 focus:ring-[#C4622D]/20"
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
                      className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[#A8A29E]"
                      width="15"
                      height="15"
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

                {/* Message */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="contact-message"
                    className="font-medium text-[#1C1917] text-sm"
                  >
                    Message{" "}
                    <span className="text-[#C4622D]" aria-label="required">
                      *
                    </span>
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={5}
                    placeholder="How can we help you?"
                    className="resize-none rounded-[12px] border border-[#D6C5B0] bg-white px-4 py-3 text-[#1C1917] text-sm placeholder-[#A8A29E] transition-colors duration-[120ms] focus:border-[#C4622D] focus:outline-none focus:ring-2 focus:ring-[#C4622D]/20"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-1 inline-flex h-11 items-center justify-center rounded-full bg-[#C4622D] font-medium text-sm text-white shadow-[0_4px_14px_rgba(196,98,45,0.3)] transition-colors duration-[180ms] hover:bg-[#A84E23] focus-visible:outline-2 focus-visible:outline-[#C4622D] focus-visible:outline-offset-2 active:scale-[0.98]"
                >
                  Send message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
