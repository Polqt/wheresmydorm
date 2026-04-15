import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { reportReasonValues } from "./moderation";

export const threadIdSeparator = "__";

export function encodeThreadId(listingId: string, otherUserId: string) {
  return `${listingId}${threadIdSeparator}${otherUserId}`;
}

export function decodeThreadId(threadId: string) {
  const [listingId, otherUserId] = threadId.split(threadIdSeparator);

  if (!listingId || !otherUserId) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid thread id." });
  }

  return { listingId, otherUserId };
}

// ---------------------------------------------------------------------------
// Shared schemas
// ---------------------------------------------------------------------------

export const threadIdInputSchema = z.object({
  threadId: z.string().min(1),
});

export const sendMessageSchema = z
  .object({
    listingId: z.string().uuid(),
    receiverId: z.string().uuid(),
    body: z.string().trim().max(2000).default(""),
    mediaUrl: z.string().url().optional(),
  })
  .refine((v) => v.body.length > 0 || v.mediaUrl, {
    message: "A message needs text or an attachment.",
  });

export const blockUserSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().trim().max(300).optional(),
});

export const reportConversationSchema = z.object({
  notes: z.string().trim().max(500).optional(),
  reason: z.enum(reportReasonValues),
  threadId: z.string().min(1),
});

export const setInquiryStatusSchema = z.object({
  status: z.enum(["pending", "responded", "closed"]),
  threadId: z.string().min(1),
});
