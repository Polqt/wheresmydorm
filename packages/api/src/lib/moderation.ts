export const moderationStatusValues = [
  "pending",
  "reviewed",
  "actioned",
  "dismissed",
] as const;

export const reportReasonValues = [
  "spam",
  "fake",
  "offensive",
  "misleading",
  "other",
] as const;

export type ModerationStatus = (typeof moderationStatusValues)[number];
export type ReportReason = (typeof reportReasonValues)[number];
