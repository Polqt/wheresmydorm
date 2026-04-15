import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import {
  inquiryStatusEnum,
  reportReasonEnum,
  reportStatusEnum,
} from "./config";
import { listings } from "./listings";
import { profiles } from "./profiles";

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    receiverId: uuid("receiver_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),

    body: text("body").notNull(),
    mediaUrl: text("media_url"),
    isRead: boolean("is_read").notNull().default(false),
    readAt: timestamp("read_at", { withTimezone: true }),
    isDeleted: boolean("is_deleted").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("messages_thread_idx").on(t.listingId, t.senderId, t.receiverId),
    index("messages_receiver_idx").on(t.receiverId),
    index("messages_unread_idx").on(t.receiverId, t.isRead),
    index("messages_created_idx").on(t.createdAt),
  ],
);

export const userBlocks = pgTable(
  "user_blocks",
  {
    blockerId: uuid("blocker_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    blockedId: uuid("blocked_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("user_blocks_blocker_idx").on(t.blockerId)],
);

export const inquiryStatuses = pgTable(
  "inquiry_statuses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    finderId: uuid("finder_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    listerId: uuid("lister_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    status: inquiryStatusEnum("status").notNull().default("pending"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("inquiry_statuses_listing_idx").on(
      t.listingId,
      t.finderId,
      t.listerId,
    ),
  ],
);

export const conversationReports = pgTable(
  "conversation_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    reportedUserId: uuid("reported_user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    reason: reportReasonEnum("reason").notNull(),
    notes: text("notes"),
    status: reportStatusEnum("status").notNull().default("pending"),
    reviewedBy: uuid("reviewed_by").references(() => profiles.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("conversation_reports_status_idx").on(t.status),
    index("conversation_reports_listing_idx").on(t.listingId, t.reporterId),
  ],
);

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type InquiryStatus = typeof inquiryStatuses.$inferSelect;
export type ConversationReport = typeof conversationReports.$inferSelect;
