"use client";

import React, { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useHeroScrollProgress } from "@/components/sections/hero/use-hero-scroll-progress";

interface VideoScrollHeroProps {
  videoSrc?: string;
  enableAnimations?: boolean;
  className?: string;
  startScale?: number;
}

/** Registry scaffold from 21st.dev / isaiahbjork / video-scroll-hero. Homepage uses HomeHeroShell. */
export function VideoScrollHero({
  videoSrc = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  enableAnimations = true,
  className = "",
  startScale = 0.25,
}: VideoScrollHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const animate = enableAnimations && !shouldReduceMotion;
  const progress = useHeroScrollProgress(containerRef, animate);
  const scrollScale = animate ? startScale + progress * (1 - startScale) : 1;

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="relative h-[200vh] bg-background">
        <div className="sticky top-0 z-10 flex h-screen w-full items-center justify-center">
          <div
            className="relative flex items-center justify-center will-change-transform"
            style={{
              transform: `scale(${scrollScale})`,
              transformOrigin: "center center",
            }}
          >
            <video
              autoPlay
              loop
              muted
              playsInline
              className="h-[60vh] w-[80vw] max-w-4xl rounded-2xl object-cover shadow-2xl"
            >
              <source src={videoSrc} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            <motion.div
              className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/20 backdrop-blur-[1px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <div className="px-4 text-center text-white">
                <motion.h1
                  className="mb-4 text-2xl font-bold md:text-4xl lg:text-6xl"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.8,
                    duration: 0.8,
                    type: "spring",
                    stiffness: 200,
                    damping: 25,
                  }}
                >
                  Scroll to Scale
                </motion.h1>
                <motion.p
                  className="max-w-2xl px-4 text-sm text-white/80 md:text-lg lg:text-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 1.0,
                    duration: 0.8,
                    type: "spring",
                    stiffness: 200,
                    damping: 25,
                  }}
                >
                  Watch as the video expands with your scroll
                </motion.p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
