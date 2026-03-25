export function formatMemberSince(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export function getInitials(firstName?: string | null, lastName?: string | null): string {
  return `${firstName?.[0] ?? "W"}${lastName?.[0] ?? "D"}`.toUpperCase();
}
