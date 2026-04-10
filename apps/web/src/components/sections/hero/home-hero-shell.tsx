"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { MarketingNavbarBar } from "@/components/layout/navbar";
import { LiquidGlassPillLink } from "@/components/ui/liquid-glass-pill";
import { useHeroScrollProgress } from "@/components/sections/hero/use-hero-scroll-progress";
import heroImg from "@/assets/images/HERO_.jpg";

const START_SCALE = 0.22;

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}

export function HomeHeroShell() {
  const containerRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const animate = !reduceMotion;
  const progress = useHeroScrollProgress(containerRef, animate);

  const scale = animate ? START_SCALE + progress * (1 - START_SCALE) : 1;
  const navOpacity = animate ? clamp01(progress / 0.24) : 1;
  const copyOpacity = animate ? clamp01((progress - 0.06) / 0.3) : 1;
  const navPointerEvents = !animate || navOpacity > 0.08 ? "auto" : "none";

  return (
    <section
      ref={containerRef}
      aria-label="Hero"
      className="relative min-h-[200vh] bg-[#0B1220] text-white"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_70%_20%,rgba(91,111,209,0.18),transparent_55%)]"
      />

      <motion.header
        className="fixed left-0 right-0 top-0 z-50 flex justify-center px-5 pb-2 pt-4"
        style={{
          opacity: navOpacity,
          pointerEvents: navPointerEvents as React.CSSProperties["pointerEvents"],
        }}
      >
        <div className="pointer-events-auto flex w-full justify-center">
          <MarketingNavbarBar variant="dark" />
        </div>
      </motion.header>

      <div className="sticky top-0 flex h-screen flex-col overflow-hidden">
        <div className="flex flex-1 items-center">
          <div className="mx-auto grid w-full max-w-[1200px] items-center gap-10 px-5 lg:grid-cols-2 lg:gap-14 lg:px-10">
            <motion.div
              className="max-w-xl pt-14 lg:pt-0"
              style={{ opacity: copyOpacity }}
            >
              <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm">
                <span
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#B5CAFF]"
                  aria-hidden="true"
                />
                Now available for students across campuses
              </span>

              <h1 className="font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] tracking-tight text-[#FFF7ED]">
                Find your space.{" "}
                <span className="text-white">Choose with confidence.</span>
              </h1>

              <p className="mt-6 max-w-[52ch] text-lg font-medium leading-relaxed text-white/70">
                Where&rsquo;s My Dorm helps you discover, compare, and review dorms and
                rentals through real locations and real experiences.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <LiquidGlassPillLink href="#" size="lg" variant="onDark" className="font-semibold">
                  Get the app
                </LiquidGlassPillLink>
                <LiquidGlassPillLink
                  href="#product"
                  size="lg"
                  variant="onDark"
                  className="font-semibold"
                  onClick={(e) => {
                    e.preventDefault();
                    document.querySelector("#product")?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }}
                >
                  Watch a demo
                </LiquidGlassPillLink>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-white/65">
                <span className="flex items-center gap-2">
                  <span className="text-base font-semibold text-emerald-400">12,000+</span>
                  verified listings
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-base font-semibold text-[#B5CAFF]">40+</span>
                  partner campuses
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-base font-semibold text-amber-400">4.8★</span>
                  student rating
                </span>
              </div>
            </motion.div>

            <div className="relative flex min-h-[36vh] items-center justify-center lg:min-h-[50vh]">
              <div
                className="will-change-transform"
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: "center center",
                }}
              >
                <div className="overflow-hidden rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.45)] ring-1 ring-white/10">
                  <Image
                    src={heroImg}
                    alt="Bright student room with bed and study desk"
                    width={1200}
                    height={800}
                    priority
                    className="h-[min(52vh,28rem)] w-[min(88vw,32rem)] object-cover"
                    sizes="(max-width: 1024px) 88vw, 32rem"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
