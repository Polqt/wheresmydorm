import type { OnboardingSlide } from "@/types/onboarding";

export const ONBOARDING_COMPLETE_KEY = "onboarding_complete_v2";

export const ONBOARDING_SLIDES: readonly OnboardingSlide[] = [
  {
    body: "Browse verified dorms and rentals on a map built for campus life.",
    heading: "Find your next home",
    overline: "DISCOVER",
    theme: "primary900",
  },
  {
    body: "Get smarter matches for your budget, commute, amenities, and vibe.",
    heading: "Ask AI anything",
    overline: "GUIDANCE",
    theme: "primary700",
  },
  {
    body: "Read honest reviews from verified renters before you commit to a place.",
    heading: "Reviews you can trust",
    overline: "COMMUNITY",
    theme: "primary500",
  },
] as const;
