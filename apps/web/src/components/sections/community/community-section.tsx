const REVIEWS_ROW_1 = [
  {
    rating: 5,
    quote:
      "Found my apartment in under a week. The campus proximity filter was a game-changer — I knew exactly how long it'd take to walk to class.",
    name: "Aisha Kamara",
    role: "1st-year student, UCT",
    initials: "AK",
    avatarColor: "#C4622D",
  },
  {
    rating: 5,
    quote:
      "I was dreading the apartment hunt but Where's My Dorm made it painless. Verified listings gave me peace of mind as an out-of-state student.",
    name: "Liam Torres",
    role: "Transfer student, UW",
    initials: "LT",
    avatarColor: "#1A3A2A",
  },
  {
    rating: 4,
    quote:
      "The roommate matching feature is genuinely good. My roommate and I have opposite schedules and it suits us perfectly. Highly recommend.",
    name: "Priya Nair",
    role: "Postgrad student, UCL",
    initials: "PN",
    avatarColor: "#B07D00",
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
    avatarColor: "#6B5EA8",
  },
  {
    rating: 5,
    quote:
      "Finally an app that understands student budgets. The pricing breakdown per listing is really clear and transparent.",
    name: "Yuki Tanaka",
    role: "Exchange student, NYU",
    initials: "YT",
    avatarColor: "#1A3A2A",
  },
  {
    rating: 4,
    quote:
      "The in-app messaging is so much better than emailing landlords. Responses were quick and I felt safe throughout the process.",
    name: "Fatima Al-Rashid",
    role: "2nd-year student, UofT",
    initials: "FA",
    avatarColor: "#C4622D",
  },
] as const;

const BLOGS = [
  {
    tag: "Housing Tips",
    tagColor: "#C4622D",
    tagBg: "#FFF5EE",
    title: "7 things to check before signing a student lease",
    description:
      "Avoid costly surprises on move-in day. We break down the clauses every student should review before putting pen to paper.",
    readTime: "5 min read",
  },
  {
    tag: "Campus Life",
    tagColor: "#1A3A2A",
    tagBg: "#F0F7F2",
    title: "Living on-campus vs off-campus: a real comparison",
    description:
      "Cost, freedom, commute time, social life — we weigh the pros and cons so you can make the decision that fits your year.",
    readTime: "7 min read",
  },
  {
    tag: "Roommates",
    tagColor: "#B07D00",
    tagBg: "#FDF8EC",
    title: "How to find (and keep) a great roommate as a student",
    description:
      "From setting house rules to navigating shared expenses, here's everything you need to cohabit without conflict.",
    readTime: "6 min read",
  },
] as const;

function StarRating({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of 5 stars`}
      role="img"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill={i < rating ? "#F0A500" : "none"}
          stroke={i < rating ? "#F0A500" : "#D6C5B0"}
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
  avatarColor,
}: {
  rating: number;
  quote: string;
  name: string;
  role: string;
  initials: string;
  avatarColor: string;
}) {
  return (
    <article className="flex min-w-[300px] max-w-sm flex-col gap-4 rounded-[20px] border border-[#E8E0D5] bg-white p-6 shadow-[0_4px_16px_rgba(28,25,23,0.06)]">
      <StarRating rating={rating} />
      <blockquote className="grow text-[#1C1917] text-sm leading-relaxed">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <footer className="flex items-center gap-3 border-[#E8E0D5] border-t pt-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-semibold text-white text-xs"
          style={{ backgroundColor: avatarColor }}
          aria-hidden="true"
        >
          {initials}
        </div>
        <div>
          <p className="font-semibold text-[#1C1917] text-sm leading-tight">
            {name}
          </p>
          <p className="text-[#78716C] text-xs">{role}</p>
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
      className="scroll-mt-24 overflow-hidden border-[#E8E0D5] border-t bg-[#FDFBF7]"
    >
      {/* Reviews */}
      <div className="mx-auto max-w-[1200px] px-5 pt-20 pb-14 lg:px-10 lg:pt-28">
        <div className="mb-14">
          <span className="mb-4 inline-flex items-center rounded-full border border-[#C4622D]/30 bg-[#C4622D]/08 px-3.5 py-1 font-semibold text-[#C4622D] text-xs uppercase tracking-wide">
            Reviews
          </span>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <h2
              id="community-heading"
              className="text-[#1C1917] leading-tight tracking-[-0.02em]"
              style={{
                fontFamily: "var(--font-dm-serif)",
                fontSize: "clamp(1.9rem, 4vw, 3rem)",
              }}
            >
              Loved by students everywhere
            </h2>
            <p className="max-w-[36ch] text-[#78716C] text-base leading-relaxed lg:text-right">
              Thousands of students have already found their home through
              Where&rsquo;s My Dorm.
            </p>
          </div>
        </div>

        {/* Row 1 */}
        <div
          className="scrollbar-none -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 lg:mx-0 lg:grid lg:grid-cols-3 lg:px-0"
          role="list"
          aria-label="Student reviews row 1"
        >
          {REVIEWS_ROW_1.map((r) => (
            <div
              key={r.name}
              className="shrink-0 snap-start lg:min-w-0 lg:shrink"
              role="listitem"
            >
              <ReviewCard {...r} />
            </div>
          ))}
        </div>

        {/* Row 2 */}
        <div
          className="scrollbar-none -mx-5 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 lg:mx-0 lg:grid lg:grid-cols-3 lg:px-0"
          role="list"
          aria-label="Student reviews row 2"
        >
          {REVIEWS_ROW_2.map((r) => (
            <div
              key={r.name}
              className="shrink-0 snap-start lg:min-w-0 lg:shrink"
              role="listitem"
            >
              <ReviewCard {...r} />
            </div>
          ))}
        </div>
      </div>

      {/* Blogs */}
      <div className="border-[#E8E0D5] border-t bg-white">
        <div className="mx-auto max-w-[1200px] px-5 py-20 lg:px-10 lg:py-28">
          <div className="mb-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="mb-4 inline-flex items-center rounded-full border border-[#C4622D]/30 bg-[#C4622D]/08 px-3.5 py-1 font-semibold text-[#C4622D] text-xs uppercase tracking-wide">
                Blog
              </span>
              <h2
                className="text-[#1C1917] leading-tight tracking-[-0.02em]"
                style={{
                  fontFamily: "var(--font-dm-serif)",
                  fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                }}
              >
                Student housing guides
              </h2>
            </div>
            <a
              href="#"
              className="inline-flex shrink-0 items-center gap-1.5 rounded font-medium text-[#C4622D] text-sm transition-colors duration-[180ms] hover:text-[#A84E23] focus-visible:outline-2 focus-visible:outline-[#C4622D] focus-visible:outline-offset-2"
            >
              View all posts
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          </div>

          <div
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            role="list"
            aria-label="Blog posts"
          >
            {BLOGS.map((post) => (
              <article
                key={post.title}
                role="listitem"
                className="group flex flex-col overflow-hidden rounded-[20px] border border-[#E8E0D5] bg-[#FDFBF7] transition-all duration-[220ms] hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(28,25,23,0.10)]"
              >
                {/* Colored accent bar */}
                <div
                  className="h-1.5 w-full"
                  style={{ backgroundColor: post.tagColor }}
                />

                <div className="flex grow flex-col gap-3 p-6">
                  <span
                    className="self-start rounded-full px-2.5 py-1 font-semibold text-[11px] tracking-wide"
                    style={{
                      color: post.tagColor,
                      backgroundColor: post.tagBg,
                    }}
                  >
                    {post.tag}
                  </span>
                  <h3
                    className="font-semibold text-[#1C1917] text-base leading-snug"
                    style={{ transition: "color 180ms" }}
                  >
                    {post.title}
                  </h3>
                  <p className="grow text-[#78716C] text-sm leading-relaxed">
                    {post.description}
                  </p>
                  <div className="flex items-center justify-between border-[#E8E0D5] border-t pt-3">
                    <span className="text-[#A8A29E] text-xs">
                      {post.readTime}
                    </span>
                    <a
                      href="#"
                      className="rounded font-medium text-sm transition-colors duration-[180ms] focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{ color: post.tagColor }}
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
