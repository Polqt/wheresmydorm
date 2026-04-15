import Image from "next/image";
import heroImg from "@/assets/images/JP227.jpeg";
import { HeroCanvasLoader } from "./hero-canvas-loader";

const GRAIN_SVG =
  "data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

const anim = (name: string, delay: number, duration = 700) =>
  ({
    animation: `${name} ${duration}ms cubic-bezier(0.22,1,0.36,1) both`,
    animationDelay: `${delay}ms`,
  }) as React.CSSProperties;

export function Hero() {
  return (
    <section
      aria-label="Hero"
      className="relative overflow-hidden bg-[#1C1917]"
    >
      {/* Three.js particle network — procedural oscillation */}
      <HeroCanvasLoader />

      {/* Grain texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] mix-blend-overlay"
        style={{
          backgroundImage: `url("${GRAIN_SVG}")`,
          backgroundSize: "200px 200px",
          opacity: 0.06,
        }}
      />

      {/* Giant decorative letterform */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-[-4vw] z-0 -translate-y-[55%] select-none font-serif text-[#FDFBF7] leading-none"
        style={{
          fontSize: "clamp(260px, 32vw, 520px)",
          opacity: 0.035,
          fontFamily: "var(--font-dm-serif)",
        }}
      >
        D
      </div>

      {/* Warm radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-[-10%] z-0 h-[600px] w-[600px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(196,98,45,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Diagonal bottom transition to cream */}
      <div
        aria-hidden="true"
        className="absolute right-0 bottom-0 left-0 z-[2] h-20 bg-[#FDFBF7]"
        style={{ clipPath: "polygon(0 100%, 100% 100%, 100% 0)" }}
      />

      <div className="relative z-[3] mx-auto max-w-[1200px] px-5 pt-24 pb-32 lg:px-10 lg:pt-28 lg:pb-44">
        <div className="grid items-center gap-14 lg:grid-cols-[1.15fr_0.85fr]">
          {/* ── Copy ── */}
          <div>
            {/* Pill badge */}
            <span
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#C4622D]/40 bg-[#C4622D]/10 px-4 py-1.5 font-medium text-[#F4A67A] text-xs"
              style={anim("fade-up", 0)}
            >
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#C4622D]"
                aria-hidden="true"
              />
              Now available across 40+ campuses
            </span>

            <h1
              className="mb-6 text-[#FDFBF7] leading-[1.0] tracking-[-0.02em]"
              style={{
                ...anim("fade-up", 100),
                fontFamily: "var(--font-dm-serif)",
                fontSize: "clamp(3rem, 6.5vw, 5.5rem)",
              }}
            >
              Find your
              <br />
              <em
                className="text-[#C4622D] not-italic"
                style={{
                  fontStyle: "italic",
                  fontFamily: "var(--font-dm-serif)",
                }}
              >
                perfect
              </em>{" "}
              dorm.
            </h1>

            <p
              className="mb-10 max-w-[46ch] text-[#A8A29E] text-lg leading-relaxed"
              style={anim("fade-up", 200)}
            >
              Where&rsquo;sMyDorm helps you discover, compare, and review dorms
              and rentals through real locations and real student experiences.
            </p>

            <div
              className="flex flex-wrap items-center gap-4"
              style={anim("fade-up", 300)}
            >
              <a
                href="#"
                className="inline-flex h-12 items-center rounded-full bg-[#C4622D] px-7 font-medium text-base text-white shadow-[0_6px_24px_rgba(196,98,45,0.38)] transition-colors duration-[180ms] hover:bg-[#A84E23] focus-visible:outline-2 focus-visible:outline-[#F4A67A] focus-visible:outline-offset-2 active:scale-[0.98]"
              >
                Get the app
              </a>
              <a
                href="#product"
                className="inline-flex h-12 items-center rounded-full border border-[#FDFBF7]/20 px-7 font-medium text-[#FDFBF7]/75 text-base transition-colors duration-[180ms] hover:border-[#FDFBF7]/35 hover:bg-[#FDFBF7]/08 hover:text-[#FDFBF7] focus-visible:outline-2 focus-visible:outline-[#F4A67A] focus-visible:outline-offset-2 active:scale-[0.98]"
              >
                See how it works
              </a>
            </div>

            {/* Stats strip */}
            <div
              className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 border-[#FDFBF7]/08 border-t pt-10"
              style={anim("fade-up", 430)}
            >
              {[
                {
                  value: "12,000+",
                  label: "verified listings",
                  color: "#F0A500",
                },
                { value: "40+", label: "partner campuses", color: "#C4622D" },
                { value: "4.8★", label: "student rating", color: "#6DB88E" },
              ].map(({ value, label, color }) => (
                <div key={label} className="flex items-baseline gap-1.5">
                  <span
                    className="font-semibold text-xl tabular-nums"
                    style={{ color }}
                  >
                    {value}
                  </span>
                  <span className="text-[#6B6560] text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Image card ── */}
          <div
            aria-hidden="true"
            className="hidden lg:block"
            style={anim("slide-in-right", 200, 800)}
          >
            <div
              className="relative overflow-hidden rounded-[24px] border border-[#FDFBF7]/10 shadow-[0_32px_80px_rgba(0,0,0,0.5)]"
              style={{ transform: "rotate(1.8deg)" }}
            >
              <div className="relative aspect-[3/4]">
                <Image
                  src={heroImg}
                  alt="JP227 Residences building exterior — a modern student housing property"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 0px, 45vw"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1C1917]/85 via-[#1C1917]/15 to-transparent"
                />
              </div>

              {/* Floating availability card */}
              <div className="absolute right-4 bottom-5 left-4 rounded-[16px] border border-[#FDFBF7]/10 bg-[#1C1917]/70 p-4 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#C4622D]/30 bg-[#C4622D]/25">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#F4A67A"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-[#FDFBF7] text-sm">
                      JP227 Residences
                    </p>
                    <p className="text-[#78716C] text-xs">
                      0.3 km from campus · 2 rooms left
                    </p>
                  </div>
                  <span className="ml-auto rounded-full bg-[#6DB88E]/15 px-2.5 py-1 font-semibold text-[#6DB88E] text-xs">
                    Available
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
