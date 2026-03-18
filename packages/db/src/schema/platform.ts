import {
  boolean, decimal, index, pgTable, text, timestamp, uuid,
} from "drizzle-orm/pg-core";
import {
  notificationTypeEnum, paymentStatusEnum,
  paymentTypeEnum, searchEventTypeEnum,
} from "./config";
import { profiles } from "./profiles";
import { listings } from "./listings";

export const searchEvents = pgTable("search_events", {
  id:        uuid("id").primaryKey().defaultRandom(),
  userId:    uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  listingId: uuid("listing_id").references(() => listings.id, { onDelete: "set null" }),
  eventType: searchEventTypeEnum("event_type").notNull(),
  searchesRemainingAfter: text("searches_remaining_after"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("search_events_user_idx").on(t.userId),
  index("search_events_gate_idx").on(t.userId, t.listingId, t.eventType),
]);

export const payments = pgTable("payments", {
  id:        uuid("id").primaryKey().defaultRandom(),
  userId:    uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  listingId: uuid("listing_id").references(() => listings.id, { onDelete: "set null" }),

  type:   paymentTypeEnum("type").notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),

  paymongoPaymentId:        text("paymongo_payment_id"),
  paymongoPaymentIntentId:  text("paymongo_payment_intent_id"),
  paymentMethod:            text("payment_method"),
  webhookPayload:           text("webhook_payload"),

  paidAt:     timestamp("paid_at",     { withTimezone: true }),
  refundedAt: timestamp("refunded_at", { withTimezone: true }),
  createdAt:  timestamp("created_at",  { withTimezone: true }).notNull().defaultNow(),
  updatedAt:  timestamp("updated_at",  { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("payments_user_idx").on(t.userId),
  index("payments_status_idx").on(t.status),
  index("payments_paymongo_idx").on(t.paymongoPaymentId),
]);

export const notifications = pgTable("notifications", {
  id:            uuid("id").primaryKey().defaultRandom(),
  userId:        uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  type:          notificationTypeEnum("type").notNull(),
  title:         text("title").notNull(),
  body:          text("body").notNull(),
  isRead:        boolean("is_read").notNull().default(false),
  readAt:        timestamp("read_at", { withTimezone: true }),
  referenceId:   text("reference_id"),
  referenceType: text("reference_type"),
  createdAt:     timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("notifications_user_idx").on(t.userId),
  index("notifications_unread_idx").on(t.userId, t.isRead),
  index("notifications_created_idx").on(t.createdAt),
]);

export const savedListings = pgTable("saved_listings", {
  finderId:  uuid("finder_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("saved_listings_finder_idx").on(t.finderId),
]);

export type SearchEvent  = typeof searchEvents.$inferSelect;
export type Payment      = typeof payments.$inferSelect;
export type NewPayment   = typeof payments.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type SavedListing = typeof savedListings.$inferSelect;