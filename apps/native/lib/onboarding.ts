import type { OnboardingSlide } from "@/types/onboarding";

export const ONBOARDING_COMPLETE_KEY = "onboarding_complete_v2";

export const ONBOARDING_SLIDES: readonly OnboardingSlide[] = [
  {
    body: "Search nearby stays with map-first browsing, honest filters, and the details students actually care about.",
    heading: "Find your next home with less guesswork",
    overline: "DISCOVER",
    theme: "primary900",
  },
  {
    body: "Compare commute, budget, amenities, and neighborhood feel before you commit to a place.",
    heading: "Choose places that fit your everyday routine",
    overline: "GUIDANCE",
    theme: "primary700",
  },
  {
    body: "Save favorites, check verified reviews, and message listers when you are ready to move forward.",
    heading: "Move from discovery to decision in one flow",
    overline: "COMMUNITY",
    theme: "primary500",
  },
] as const;
