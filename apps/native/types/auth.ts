import type { Profile } from "../../../packages/db/src/schema/profiles";

export type OAuthProvider = "google" | "facebook";
export type ActiveProvider = OAuthProvider | null;
export type RoleOption = Extract<
  NonNullable<Profile["role"]>,
  "finder" | "lister"
>;
export type PendingAuthEmail = NonNullable<Profile["contactEmail"]>;

export type RoleCard = {
  emoji: string;
  role: RoleOption;
  subtitle: string;
  title: string;
};

export type RoleCardProps = {
  card: RoleCard;
  disabled: boolean;
  isSelected: boolean;
  onSelect: (role: RoleOption) => void;
};
