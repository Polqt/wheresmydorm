import {
  index, integer, jsonb, pgTable, real, text, timestamp, uuid,
} from "drizzle-orm/pg-core";
import { reportReasonEnum, reportStatusEnum } from "./config";
import { profiles } from "./profiles";
import { listings } from "./listings";

export const reviews = pgTable("reviews", {
  id:        uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  finderId:  uuid("finder_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),

  ratingOverall:     real("rating_overall").notNull(),
  ratingValue:       real("rating_value").notNull(),
  ratingSafety:      real("rating_safety").notNull(),
  ratingCleanliness: real("rating_cleanliness").notNull(),
  ratingLocation:    real("rating_location").notNull(),
  ratingLandlord:    real("rating_landlord").notNull(),

  body:       text("body").notNull(),
  photoUrls:  jsonb("photo_urls").$type<string[]>().notNull().default([]),

  helpfulCount:      integer("helpful_count").notNull().default(0),
  listerResponse:    text("lister_response"),
  listerRespondedAt: timestamp("lister_responded_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("reviews_listing_idx").on(t.listingId),
  index("reviews_finder_idx").on(t.finderId),
  index("reviews_unique_idx").on(t.listingId, t.finderId),
]);

export const reviewHelpfulVotes = pgTable("review_helpful_votes", {
  reviewId:  uuid("review_id").notNull().references(() => reviews.id, { onDelete: "cascade" }),
  userId:    uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("review_votes_unique_idx").on(t.reviewId, t.userId),
]);

export const reviewReports = pgTable("review_reports", {
  id:         uuid("id").primaryKey().defaultRandom(),
  reviewId:   uuid("review_id").notNull().references(() => reviews.id, { onDelete: "cascade" }),
  reporterId: uuid("reporter_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  reason:     reportReasonEnum("reason").notNull(),
  notes:      text("notes"),
  status:     reportStatusEnum("status").notNull().default("pending"),
  reviewedBy: uuid("reviewed_by").references(() => profiles.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt:  timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("review_reports_status_idx").on(t.status),
]);

export type Review       = typeof reviews.$inferSelect;
export type NewReview    = typeof reviews.$inferInsert;
export type ReviewReport = typeof reviewReports.$inferSelect;