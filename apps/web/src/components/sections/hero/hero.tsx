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
        className="pointer-events-none absolute right-[-4vw] top-1/2 -translate-y-[55%] select-none leading-none z-0 font-serif text-[#FDFBF7]"
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
        className="pointer-events-none absolute top-0 left-[-10%] w-[600px] h-[600px] rounded-full z-0"
        style={{
          background:
            "radial-gradient(circle, rgba(196,98,45,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Diagonal bottom transition to cream */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 right-0 h-20 bg-[#FDFBF7] z-[2]"
        style={{ clipPath: "polygon(0 100%, 100% 100%, 100% 0)" }}
      />

      <div className="relative z-[3] mx-auto max-w-[1200px] px-5 lg:px-10 pt-24 pb-32 lg:pt-28 lg:pb-44">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-14 items-center">
          {/* ── Copy ── */}
          <div>
            {/* Pill badge */}
            <span
              className="inline-flex items-center gap-2 rounded-full border border-[#C4622D]/40 bg-[#C4622D]/10 px-4 py-1.5 text-xs font-medium text-[#F4A67A] mb-8"
              style={anim("fade-up", 0)}
            >
              <span
                className="h-1.5 w-1.5 rounded-full bg-[#C4622D] animate-pulse"
                aria-hidden="true"
              />
              Now available across 40+ campuses
            </span>

            <h1
              className="text-[#FDFBF7] leading-[1.0] tracking-[-0.02em] mb-6"
              style={{
                ...anim("fade-up", 100),
                fontFamily: "var(--font-dm-serif)",
                fontSize: "clamp(3rem, 6.5vw, 5.5rem)",
              }}
            >
              Find your
              <br />
              <em
                className="not-italic text-[#C4622D]"
                style={{ fontStyle: "italic", fontFamily: "var(--font-dm-serif)" }}
              >
                perfect
              </em>{" "}
              dorm.
            </h1>

            <p
              className="text-[#A8A29E] text-lg leading-relaxed mb-10 max-w-[46ch]"
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
                className="inline-flex items-center h-12 px-7 rounded-full bg-[#C4622D] text-white font-medium text-base hover:bg-[#A84E23] transition-colors duration-[180ms] shadow-[0_6px_24px_rgba(196,98,45,0.38)] focus-visible:outline-2 focus-visible:outline-[#F4A67A] focus-visible:outline-offset-2 active:scale-[0.98]"
              >
                Get the app
              </a>
              <a
                href="#product"
                className="inline-flex items-center h-12 px-7 rounded-full border border-[#FDFBF7]/20 text-[#FDFBF7]/75 font-medium text-base hover:bg-[#FDFBF7]/08 hover:text-[#FDFBF7] hover:border-[#FDFBF7]/35 transition-colors duration-[180ms] focus-visible:outline-2 focus-visible:outline-[#F4A67A] focus-visible:outline-offset-2 active:scale-[0.98]"
              >
                See how it works
              </a>
            </div>

            {/* Stats strip */}
            <div
              className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 pt-10 border-t border-[#FDFBF7]/08"
              style={anim("fade-up", 430)}
            >
              {[
                { value: "12,000+", label: "verified listings", color: "#F0A500" },
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
                  <span className="text-sm text-[#6B6560]">{label}</span>
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
              className="relative rounded-[24px] overflow-hidden border border-[#FDFBF7]/10 shadow-[0_32px_80px_rgba(0,0,0,0.5)]"
              style={{ transform: "rotate(1.8deg)" }}
            >
              <div className="aspect-[3/4] relative">
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
                  className="absolute inset-0 bg-gradient-to-t from-[#1C1917]/85 via-[#1C1917]/15 to-transparent pointer-events-none"
                />
              </div>

              {/* Floating availability card */}
              <div className="absolute bottom-5 left-4 right-4 rounded-[16px] bg-[#1C1917]/70 backdrop-blur-md border border-[#FDFBF7]/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#C4622D]/25 border border-[#C4622D]/30 flex items-center justify-center shrink-0">
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
                    <p className="text-[#FDFBF7] text-sm font-medium">
                      JP227 Residences
                    </p>
                    <p className="text-[#78716C] text-xs">
                      0.3 km from campus · 2 rooms left
                    </p>
                  </div>
                  <span className="ml-auto text-xs font-semibold text-[#6DB88E] bg-[#6DB88E]/15 rounded-full px-2.5 py-1">
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
