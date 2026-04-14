import type { AdminUserItem } from "@/types/platform";

export type AppRole = "admin" | "finder" | "lister";
export type RoleFilter = AppRole | "all";

export const ROLE_FILTERS: RoleFilter[] = ["all", "finder", "lister", "admin"];

export type RoleTone = {
  bg: string;
  text: string;
};

export function getRoleTone(role: AppRole): RoleTone {
  switch (role) {
    case "admin":
      return { bg: "#EEF2FF", text: "#3730A3" };
    case "lister":
      return { bg: "#EEF5F1", text: "#0B4A30" };
    default:
      return { bg: "#FFF7ED", text: "#C2410C" };
  }
}

export function getUserDisplayName(user: Pick<AdminUserItem, "firstName" | "lastName">): string {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || "Unnamed user";
}

export function formatAdminDate(value: Date | string): string {
  return new Date(value).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
