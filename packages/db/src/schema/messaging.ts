import {
  boolean, index, pgTable, text, timestamp, uuid,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles";
import { listings } from "./listings";

export const messages = pgTable("messages", {
  id:         uuid("id").primaryKey().defaultRandom(),
  senderId:   uuid("sender_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  receiverId: uuid("receiver_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  listingId:  uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),

  body:      text("body").notNull(),
  mediaUrl:  text("media_url"),
  isRead:    boolean("is_read").notNull().default(false),
  readAt:    timestamp("read_at", { withTimezone: true }),
  isDeleted: boolean("is_deleted").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("messages_thread_idx").on(t.listingId, t.senderId, t.receiverId),
  index("messages_receiver_idx").on(t.receiverId),
  index("messages_unread_idx").on(t.receiverId, t.isRead),
  index("messages_created_idx").on(t.createdAt),
]);

export const userBlocks = pgTable("user_blocks", {
  blockerId:  uuid("blocker_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  blockedId:  uuid("blocked_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  reason:    text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("user_blocks_blocker_idx").on(t.blockerId),
]);

export type Message   = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;