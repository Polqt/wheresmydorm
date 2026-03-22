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
      className="scroll-mt-24 bg-white border-b border-[#E2E8F0]"
    >
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left copy */}
          <div className="lg:sticky lg:top-32">
            <span className="inline-flex items-center rounded-full border border-[#B5CAFF] bg-[#F5F7FF] px-3.5 py-1 text-xs font-semibold text-[#5B6FD1] mb-4">
              Contact
            </span>
            <h2
              id="contact-heading"
              className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold text-[#0F172A] tracking-tight leading-tight mb-5"
            >
              Get in touch
            </h2>
            <p className="text-[#475569] text-lg leading-relaxed mb-8 max-w-[44ch]">
              Have a question, a listing issue, or a partnership idea? We&rsquo;d love
              to hear from you. Our team typically replies within one business day.
            </p>

            <ul className="flex flex-col gap-5" aria-label="Contact details">
              {[
                {
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  ),
                  label: "Email",
                  value: "hello@wheresmydorm.app",
                },
                {
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                  ),
                  label: "Response time",
                  value: "Within 1 business day",
                },
              ].map((item) => (
                <li key={item.label} className="flex items-center gap-3 text-sm text-[#475569]">
                  <span className="w-9 h-9 rounded-[10px] bg-[#F5F7FF] border border-[#E2E8F0] flex items-center justify-center text-[#5B6FD1] shrink-0">
                    {item.icon}
                  </span>
                  <div>
                    <p className="text-xs text-[#64748B] font-medium">{item.label}</p>
                    <p className="text-[#0F172A] font-medium">{item.value}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Form card */}
          <div className="rounded-[20px] bg-white border border-[#E2E8F0] shadow-[0_8px_24px_rgba(15,23,42,0.10)] p-8">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#F0FDF4] border border-[#86EFAC] flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-[#0F172A]">Message sent!</h3>
                <p className="text-[#475569] text-sm max-w-[32ch]">
                  Thanks for reaching out. We&rsquo;ll get back to you within one business day.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-2 text-sm font-medium text-[#5B6FD1] hover:text-[#3746A3] transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-[#5B6FD1] focus-visible:outline-offset-2 rounded"
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
                  {/* Name */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="contact-name"
                      className="text-sm font-medium text-[#0F172A]"
                    >
                      Name <span className="text-[#EF4444]" aria-label="required">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      name="name"
                      required
                      autoComplete="name"
                      placeholder="Your full name"
                      className="h-11 rounded-[12px] border border-[#E2E8F0] bg-white px-4 text-sm text-[#0F172A] placeholder-[#94A3B8] transition-colors duration-[120ms] focus:outline-none focus:border-[#5B6FD1] focus:ring-2 focus:ring-[#5B6FD1]/30"
                    />
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="contact-email"
                      className="text-sm font-medium text-[#0F172A]"
                    >
                      Email <span className="text-[#EF4444]" aria-label="required">*</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      name="email"
                      required
                      autoComplete="email"
                      placeholder="you@university.edu"
                      className="h-11 rounded-[12px] border border-[#E2E8F0] bg-white px-4 text-sm text-[#0F172A] placeholder-[#94A3B8] transition-colors duration-[120ms] focus:outline-none focus:border-[#5B6FD1] focus:ring-2 focus:ring-[#5B6FD1]/30"
                    />
                  </div>
                </div>

                {/* Topic */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="contact-topic"
                    className="text-sm font-medium text-[#0F172A]"
                  >
                    Topic <span className="text-[#EF4444]" aria-label="required">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="contact-topic"
                      name="topic"
                      required
                      defaultValue=""
                      className="h-11 w-full appearance-none rounded-[12px] border border-[#E2E8F0] bg-white pl-4 pr-10 text-sm text-[#0F172A] transition-colors duration-[120ms] focus:outline-none focus:border-[#5B6FD1] focus:ring-2 focus:ring-[#5B6FD1]/30"
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
                      className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
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

                {/* Message */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="contact-message"
                    className="text-sm font-medium text-[#0F172A]"
                  >
                    Message <span className="text-[#EF4444]" aria-label="required">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={5}
                    placeholder="How can we help you?"
                    className="resize-none rounded-[12px] border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder-[#94A3B8] transition-colors duration-[120ms] focus:outline-none focus:border-[#5B6FD1] focus:ring-2 focus:ring-[#5B6FD1]/30"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-1 inline-flex items-center justify-center h-11 rounded-full bg-[#0F172A] text-white text-sm font-medium hover:bg-[#1E293B] transition-colors duration-[180ms] focus-visible:outline-2 focus-visible:outline-[#5B6FD1] focus-visible:outline-offset-2 active:scale-[0.98]"
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
