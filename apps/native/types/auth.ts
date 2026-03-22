import type { Profile } from "../../../packages/db/src/schema/profiles";

export type OAuthProvider = "apple" | "google" | "facebook";
export type ActiveProvider = OAuthProvider | null;
export type RoleOption = Extract<
  NonNullable<Profile["role"]>,
  "finder" | "lister"
>;

export type RoleCard = {
  emoji: string;
  role: RoleOption;
  subtitle: string;
  title: string;
};
