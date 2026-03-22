const REVIEWS_ROW_1 = [
  {
    rating: 5,
    quote:
      "Found my apartment in under a week. The campus proximity filter was a game-changer — I knew exactly how long it'd take to walk to class.",
    name: "Aisha Kamara",
    role: "1st-year student, UCT",
    initials: "AK",
    avatarBg: "bg-[#5B6FD1]",
  },
  {
    rating: 5,
    quote:
      "I was dreading the apartment hunt but Where's My Dorm made it painless. Verified listings gave me peace of mind as an out-of-state student.",
    name: "Liam Torres",
    role: "Transfer student, UW",
    initials: "LT",
    avatarBg: "bg-[#0F766E]",
  },
  {
    rating: 4,
    quote:
      "The roommate matching feature is genuinely good. My roommate and I have opposite schedules and it suits us perfectly. Highly recommend.",
    name: "Priya Nair",
    role: "Postgrad student, UCL",
    initials: "PN",
    avatarBg: "bg-[#EA580C]",
  },
] as const;

const REVIEWS_ROW_2 = [
  {
    rating: 5,
    quote:
      "Saved so much time not having to call dozens of landlords. Everything was in one place and I could book tours with one tap.",
    name: "Marcus Webb",
    role: "Tenant, Boston University",
    initials: "MW",
    avatarBg: "bg-[#3746A3]",
  },
  {
    rating: 5,
    quote:
      "Finally an app that understands student budgets. The pricing breakdown per listing is really clear and transparent.",
    name: "Yuki Tanaka",
    role: "Exchange student, NYU",
    initials: "YT",
    avatarBg: "bg-[#0F766E]",
  },
  {
    rating: 4,
    quote:
      "The in-app messaging is so much better than emailing landlords. Responses were quick and I felt safe throughout the process.",
    name: "Fatima Al-Rashid",
    role: "2nd-year student, UofT",
    initials: "FA",
    avatarBg: "bg-[#5B6FD1]",
  },
] as const;

const BLOGS = [
  {
    tag: "Housing Tips",
    tagColor: "text-[#5B6FD1] bg-[#F5F7FF] border-[#B5CAFF]",
    title: "7 things to check before signing a student lease",
    description:
      "Avoid costly surprises on move-in day. We break down the clauses every student should review before putting pen to paper.",
    readTime: "5 min read",
  },
  {
    tag: "Campus Life",
    tagColor: "text-[#0F766E] bg-[#F0FDF4] border-[#86EFAC]",
    title: "Living on-campus vs off-campus: a real comparison",
    description:
      "Cost, freedom, commute time, social life — we weigh the pros and cons so you can make the decision that fits your year.",
    readTime: "7 min read",
  },
  {
    tag: "Roommates",
    tagColor: "text-[#EA580C] bg-[#FFF7ED] border-[#FED7AA]",
    title: "How to find (and keep) a great roommate as a student",
    description:
      "From setting house rules to navigating shared expenses, here's everything you need to cohabit without conflict.",
    readTime: "6 min read",
  },
] as const;

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`} role="img">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={i < rating ? "#F59E0B" : "none"}
          stroke={i < rating ? "#F59E0B" : "#E2E8F0"}
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function ReviewCard({
  rating,
  quote,
  name,
  role,
  initials,
  avatarBg,
}: {
  rating: number;
  quote: string;
  name: string;
  role: string;
  initials: string;
  avatarBg: string;
}) {
  return (
    <article className="flex flex-col gap-4 rounded-[20px] bg-white border border-[#E2E8F0] shadow-[0_8px_24px_rgba(15,23,42,0.10)] p-6 min-w-[300px] max-w-sm">
      <StarRating rating={rating} />
      <blockquote className="text-sm text-[#0F172A] leading-relaxed grow">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <footer className="flex items-center gap-3 pt-2 border-t border-[#E2E8F0]">
        <div
          className={`w-9 h-9 rounded-full ${avatarBg} flex items-center justify-center text-white text-xs font-semibold shrink-0`}
          aria-hidden="true"
        >
          {initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#0F172A] leading-tight">{name}</p>
          <p className="text-xs text-[#64748B]">{role}</p>
        </div>
      </footer>
    </article>
  );
}

export function Community() {
  return (
    <section
      id="community"
      aria-labelledby="community-heading"
      className="scroll-mt-24 bg-[#F5F7FF] border-b border-[#E2E8F0] overflow-hidden"
    >
      {/* Reviews */}
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 pt-20 lg:pt-24 pb-14">
        <div className="mb-12 text-center">
          <span className="inline-flex items-center rounded-full border border-[#B5CAFF] bg-white px-3.5 py-1 text-xs font-semibold text-[#5B6FD1] mb-4">
            Reviews
          </span>
          <h2
            id="community-heading"
            className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold text-[#0F172A] tracking-tight leading-tight"
          >
            Loved by students everywhere
          </h2>
          <p className="mt-4 text-[#475569] text-lg max-w-[48ch] mx-auto leading-relaxed">
            Thousands of students have already found their home through
            Where&rsquo;s My Dorm.
          </p>
        </div>

        {/* Row 1 */}
        <div
          className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none -mx-5 px-5 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-3"
          role="list"
          aria-label="Student reviews row 1"
        >
          {REVIEWS_ROW_1.map((r) => (
            <div key={r.name} className="snap-start shrink-0 lg:shrink lg:min-w-0" role="listitem">
              <ReviewCard {...r} />
            </div>
          ))}
        </div>

        {/* Row 2 */}
        <div
          className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none mt-5 -mx-5 px-5 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-3"
          role="list"
          aria-label="Student reviews row 2"
        >
          {REVIEWS_ROW_2.map((r) => (
            <div key={r.name} className="snap-start shrink-0 lg:shrink lg:min-w-0" role="listitem">
              <ReviewCard {...r} />
            </div>
          ))}
        </div>
      </div>

      {/* Blogs */}
      <div className="border-t border-[#E2E8F0] bg-white">
        <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-24">
          <div className="mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <span className="inline-flex items-center rounded-full border border-[#B5CAFF] bg-[#F5F7FF] px-3.5 py-1 text-xs font-semibold text-[#5B6FD1] mb-4">
                Blog
              </span>
              <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-[#0F172A] tracking-tight leading-tight">
                Student housing guides
              </h2>
            </div>
            <a
              href="#"
              className="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium text-[#5B6FD1] hover:text-[#3746A3] transition-colors duration-[180ms] focus-visible:outline-2 focus-visible:outline-[#5B6FD1] focus-visible:outline-offset-2 rounded"
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
                className="flex flex-col rounded-[20px] bg-white border border-[#E2E8F0] shadow-[0_8px_24px_rgba(15,23,42,0.10)] overflow-hidden group hover:shadow-[0_16px_40px_rgba(15,23,42,0.14)] transition-shadow duration-[180ms]"
              >
                {/* Placeholder image */}
                <div className="aspect-[16/9] bg-gradient-to-br from-[#F5F7FF] to-[#E2E8F0] flex items-center justify-center">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#B5CAFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>

                <div className="flex flex-col gap-3 p-6 grow">
                  <span
                    className={`self-start text-[11px] font-semibold rounded-full border px-2.5 py-0.5 ${post.tagColor}`}
                  >
                    {post.tag}
                  </span>
                  <h3 className="text-[#0F172A] font-semibold text-base leading-snug group-hover:text-[#5B6FD1] transition-colors duration-[180ms]">
                    {post.title}
                  </h3>
                  <p className="text-[#475569] text-sm leading-relaxed grow">
                    {post.description}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
                    <span className="text-xs text-[#64748B]">{post.readTime}</span>
                    <a
                      href="#"
                      className="text-sm font-medium text-[#5B6FD1] hover:text-[#3746A3] transition-colors duration-[180ms] focus-visible:outline-2 focus-visible:outline-[#5B6FD1] focus-visible:outline-offset-2 rounded"
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
