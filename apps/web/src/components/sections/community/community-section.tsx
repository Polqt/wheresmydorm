"use client";

import { TestimonialsCarousel, type Testimonial } from "@/components/testimonials-carousel";
import { cn } from "@/lib/utils";

const TESTIMONIALS: Testimonial[] = [
  {
    text: "Found my apartment in under a week. The campus proximity filter was a game-changer — I knew exactly how long it'd take to walk to class.",
    highlight: "campus proximity filter",
    image: "https://api.dicebear.com/7.x/initials/svg?seed=AK&backgroundColor=5b6fd1",
    name: "Aisha Kamara",
    role: "1st-year student, UCT",
  },
  {
    text: "I was dreading the apartment hunt but Where's My Dorm made it painless. Verified listings gave me peace of mind as an out-of-state student.",
    highlight: "Verified listings",
    image: "https://api.dicebear.com/7.x/initials/svg?seed=LT&backgroundColor=059669",
    name: "Liam Torres",
    role: "Transfer student, UW",
  },
  {
    text: "The roommate matching feature is genuinely good. My roommate and I have opposite schedules and it suits us perfectly. Highly recommend.",
    highlight: "roommate matching feature",
    image: "https://api.dicebear.com/7.x/initials/svg?seed=PN&backgroundColor=d97706",
    name: "Priya Nair",
    role: "Postgrad student, UCL",
  },
  {
    text: "Saved so much time not having to call dozens of landlords. Everything was in one place and I could book tours with one tap.",
    highlight: "book tours",
    image: "https://api.dicebear.com/7.x/initials/svg?seed=MW&backgroundColor=4338ca",
    name: "Marcus Webb",
    role: "Tenant, Boston University",
  },
  {
    text: "Finally an app that understands student budgets. The pricing breakdown per listing is really clear and transparent.",
    highlight: "pricing breakdown",
    image: "https://api.dicebear.com/7.x/initials/svg?seed=YT&backgroundColor=059669",
    name: "Yuki Tanaka",
    role: "Exchange student, NYU",
  },
  {
    text: "The in-app messaging is so much better than emailing landlords. Responses were quick and I felt safe throughout the process.",
    highlight: "in-app messaging",
    image: "https://api.dicebear.com/7.x/initials/svg?seed=FA&backgroundColor=5b6fd1",
    name: "Fatima Al-Rashid",
    role: "2nd-year student, UofT",
  },
];

const BLOGS = [
  {
    tag: "Housing Tips",
    tagClass: "text-marketing-brand bg-marketing-brand-soft/30 border-marketing-brand/25",
    title: "7 things to check before signing a student lease",
    description:
      "Avoid costly surprises on move-in day. We break down the clauses every student should review before putting pen to paper.",
    readTime: "5 min read",
  },
  {
    tag: "Campus Life",
    tagClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
    title: "Living on-campus vs off-campus: a real comparison",
    description:
      "Cost, freedom, commute time, social life — we weigh the pros and cons so you can make the decision that fits your year.",
    readTime: "7 min read",
  },
  {
    tag: "Roommates",
    tagClass: "text-amber-800 bg-amber-50 border-amber-200",
    title: "How to find (and keep) a great roommate as a student",
    description:
      "From setting house rules to navigating shared expenses, here's everything you need to cohabit without conflict.",
    readTime: "6 min read",
  },
] as const;

export function Community() {
  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className="scroll-mt-24 border-b border-marketing-border bg-marketing-muted-bg/40 overflow-hidden"
    >
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 pt-20 lg:pt-24 pb-14">
        <div className="mb-12 text-center">
          <span className="inline-flex items-center rounded-full border border-marketing-border bg-white/80 px-3.5 py-1 text-xs font-semibold text-marketing-brand mb-4">
            Testimonials
          </span>
          <h2
            id="testimonials-heading"
            className="font-display text-[clamp(1.75rem,4vw,2.75rem)] text-marketing-ink tracking-tight leading-tight"
          >
            What students are saying
          </h2>
          <p className="mt-4 text-marketing-subhead text-lg max-w-[48ch] mx-auto leading-relaxed font-medium">
            Thousands of students have already found their home through Where&rsquo;s My
            Dorm.
          </p>
        </div>

        <TestimonialsCarousel 
          testimonials={TESTIMONIALS} 
          speed={30}
          cardHeight={240}
          className="py-2"
        />
      </div>

      <div className="border-t border-marketing-border bg-marketing-card">
        <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-24">
          <div className="mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <span className="inline-flex items-center rounded-full border border-marketing-border bg-marketing-canvas px-3.5 py-1 text-xs font-semibold text-marketing-brand mb-4">
                Blog
              </span>
              <h2 className="font-display text-[clamp(1.5rem,3vw,2.25rem)] text-marketing-ink tracking-tight leading-tight">
                Student housing guides
              </h2>
            </div>
            <a
              href="#"
              className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-marketing-brand hover:text-marketing-brand-hover transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-[#5b6fd1] focus-visible:outline-offset-2 rounded-lg"
            >
              View all posts
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          </div>

          <div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            role="list"
            aria-label="Blog posts"
          >
            {BLOGS.map((post) => (
              <article
                key={post.title}
                role="listitem"
                className="group flex flex-col rounded-2xl border border-marketing-border bg-marketing-card shadow-[0_8px_30px_rgba(15,23,42,0.06)] overflow-hidden transition-shadow duration-200 hover:shadow-[0_20px_50px_rgba(15,23,42,0.1)]"
              >
                <div className="aspect-[16/9] bg-gradient-to-br from-marketing-canvas to-marketing-muted-bg flex items-center justify-center border-b border-marketing-border">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-marketing-brand/40" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <div className="flex flex-col gap-3 p-6 grow">
                  <span
                    className={cn(
                      "self-start text-[11px] font-semibold rounded-full border px-2.5 py-0.5",
                      post.tagClass,
                    )}
                  >
                    {post.tag}
                  </span>
                  <h3 className="text-marketing-ink font-semibold text-base leading-snug group-hover:text-marketing-brand transition-colors duration-200">
                    {post.title}
                  </h3>
                  <p className="text-marketing-subhead text-sm leading-relaxed grow">
                    {post.description}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-marketing-border">
                    <span className="text-xs text-marketing-subhead">{post.readTime}</span>
                    <a
                      href="#"
                      className="text-sm font-semibold text-marketing-brand hover:text-marketing-brand-hover transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-[#5b6fd1] focus-visible:outline-offset-2 rounded"
                      aria-label={`Read more: ${post.title}`}
                    >
                      Read more →
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
