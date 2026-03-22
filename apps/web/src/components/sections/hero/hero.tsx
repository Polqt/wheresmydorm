import Image from "next/image";
import heroImg from "@/assets/images/JP227.jpeg";

export function Hero() {
  return (
    <section
      aria-label="Hero"
      className="relative overflow-hidden bg-[#0F172A] text-white"
    >
      {/* Background gradient wash */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-[#1D2662]/60 via-[#0F172A] to-[#0B0F19] pointer-events-none"
      />

      {/* Decorative blobs */}
      <div
        aria-hidden="true"
        className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-[#5B6FD1]/20 blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-24 right-0 w-[360px] h-[360px] rounded-full bg-[#EA580C]/10 blur-3xl pointer-events-none"
      />

      <div className="relative mx-auto max-w-[1200px] px-5 lg:px-10 pt-24 pb-20 lg:pt-32 lg:pb-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Copy */}
          <div className="max-w-xl">
            {/* Pill badge */}
            <span className="inline-flex items-center gap-2 rounded-full border border-[#3746A3] bg-[#1D2662]/60 px-4 py-1.5 text-xs font-medium text-[#829AFF] mb-8">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5B6FD1] animate-pulse" aria-hidden="true" />
              Now available for students across campuses
            </span>

            <h1 className="text-[clamp(2.25rem,5vw,3.5rem)] font-bold leading-[1.05] tracking-tight text-white mb-6">
              Find your space.{" "}
              <span className="text-[#829AFF]">Choose with Confidence.</span>
            </h1>

            <p className="text-lg text-[#94A3B8] leading-relaxed mb-10 max-w-[52ch]">
              Where&rsquo;sMyDorm helps you discover, compare, and review dorms and rentals through real locations and real experiences
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#"
                className="inline-flex items-center h-13 px-7 rounded-full bg-[#5B6FD1] text-white font-medium text-base hover:bg-[#3746A3] transition-colors duration-[180ms] shadow-[0_6px_20px_rgba(91,111,209,0.35)] focus-visible:outline-2 focus-visible:outline-[#B5CAFF] focus-visible:outline-offset-2 active:scale-[0.98]"
              >
                Get the app
              </a>
              <a
                href="#product"
                className="inline-flex items-center h-13 px-7 rounded-full border border-white/20 text-white/80 font-medium text-base hover:bg-white/10 hover:text-white transition-colors duration-[180ms] focus-visible:outline-2 focus-visible:outline-[#B5CAFF] focus-visible:outline-offset-2 active:scale-[0.98]"
              >
                See how it works
              </a>
            </div>

            {/* Social proof strip */}
            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-[#64748B]">
              <span className="flex items-center gap-2">
                <span className="text-[#0F766E] font-semibold text-base">12,000+</span>
                verified listings
              </span>
              <span className="flex items-center gap-2">
                <span className="text-[#5B6FD1] font-semibold text-base">40+</span>
                partner campuses
              </span>
              <span className="flex items-center gap-2">
                <span className="text-[#F59E0B] font-semibold text-base">4.8★</span>
                student rating
              </span>
            </div>
          </div>

          {/* Editorial image placeholder */}
          <div
            aria-hidden="true"
            className="hidden lg:block relative"
          >
            <div className="relative rounded-[20px] overflow-hidden border border-white/10 shadow-[0_16px_40px_rgba(15,23,42,0.5)]">
              <div className="aspect-[4/3] relative">
                <Image
                  src={heroImg}
                  alt="JP227 Residences building exterior — a modern student housing property"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 0px, 50vw"
                />
                {/* Subtle dark gradient to blend bottom with overlay card */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/60 via-transparent to-transparent pointer-events-none"
                />
              </div>
              {/* Floating card overlay */}
              <div className="absolute bottom-4 left-4 right-4 rounded-[16px] bg-white/10 backdrop-blur-sm border border-white/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#5B6FD1]/40 border border-[#5B6FD1]/30 flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B5CAFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">JP227 Residences</p>
                    <p className="text-[#94A3B8] text-xs">0.3 km from campus · 2 rooms left</p>
                  </div>
                  <span className="ml-auto text-xs font-semibold text-[#34D399] bg-[#0F766E]/20 rounded-full px-2.5 py-1">Available</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
