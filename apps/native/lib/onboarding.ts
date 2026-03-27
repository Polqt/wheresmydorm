import type { OnboardingSlide } from "@/types/onboarding";

export const ONBOARDING_COMPLETE_KEY = "onboarding_complete_v3";

export const ONBOARDING_SLIDES: readonly OnboardingSlide[] = [
  {
    body: "Choose Finder if you are searching for a place, or Lister if you are filling vacancies and managing listings.",
    heading: "Two clear roles, one focused app",
    overline: "ROLES",
    theme: "primary900",
  },
  {
    body: "Finders get a map-first search flow with saved places, feed updates, and guided discovery built around commute, budget, and fit.",
    heading: "Finder tools stay built for discovery",
    overline: "FINDER",
    theme: "primary700",
  },
  {
    body: "Listers get a dedicated dashboard for listings, inquiries, and community posts without the clutter of Finder-only features.",
    heading: "Lister tools stay built for supply",
    overline: "LISTER",
    theme: "primary500",
  },
] as const;
