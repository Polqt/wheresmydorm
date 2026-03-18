import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum        = pgEnum("user_role",          ["finder", "lister", "admin"]);
export const propertyTypeEnum    = pgEnum("property_type",      ["dorm", "apartment", "bedspace", "condo", "boarding_house", "studio"]);
export const listingStatusEnum   = pgEnum("listing_status",     ["active", "paused", "archived"]);
export const paymentTypeEnum     = pgEnum("payment_type",       ["finder_upgrade", "listing_fee"]);
export const paymentStatusEnum   = pgEnum("payment_status",     ["pending", "paid", "failed", "refunded"]);
export const searchEventTypeEnum = pgEnum("search_event_type",  ["listing_view", "ai_chat"]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "new_message", "review_response", "listing_update", "new_review",
  "bookmark_update", "price_drop", "new_listing_nearby", "payment_confirmed", "broadcast",
]);
export const reportReasonEnum  = pgEnum("report_reason",  ["spam", "fake", "offensive", "misleading", "other"]);
export const reportStatusEnum  = pgEnum("report_status",  ["pending", "reviewed", "actioned", "dismissed"]);
export const reactionTypeEnum  = pgEnum("reaction_type",  ["like", "helpful", "funny"]);