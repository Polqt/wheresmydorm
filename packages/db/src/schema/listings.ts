import {
  boolean, decimal, index, integer, jsonb,
  pgTable, real, text, timestamp, uuid,
} from "drizzle-orm/pg-core";
import { listingStatusEnum, propertyTypeEnum } from "./config";
import { profiles } from "./profiles";

export const listings = pgTable("listings", {
  id:       uuid("id").primaryKey().defaultRandom(),
  listerId: uuid("lister_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),

  title:        text("title").notNull(),
  description:  text("description").notNull(),
  propertyType: propertyTypeEnum("property_type").notNull(),

  pricePerMonth: decimal("price_per_month", { precision: 10, scale: 2 }).notNull(),
  sizeSqm:       real("size_sqm"),
  maxOccupants:  integer("max_occupants"),

  lat:      real("lat").notNull(),
  lng:      real("lng").notNull(),
  address:  text("address").notNull(),
  city:     text("city").notNull(),
  barangay: text("barangay"),

  amenities: jsonb("amenities").$type<string[]>().notNull().default([]),

  isAvailable:   boolean("is_available").notNull().default(true),
  availableFrom: timestamp("available_from", { withTimezone: true }),

  status:    listingStatusEnum("status").notNull().default("active"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),

  ratingOverall:     real("rating_overall"),
  ratingValue:       real("rating_value"),
  ratingSafety:      real("rating_safety"),
  ratingCleanliness: real("rating_cleanliness"),
  ratingLocation:    real("rating_location"),
  ratingLandlord:    real("rating_landlord"),
  reviewCount:       integer("review_count").notNull().default(0),

  viewCount:     integer("view_count").notNull().default(0),
  bookmarkCount: integer("bookmark_count").notNull().default(0),
  inquiryCount:  integer("inquiry_count").notNull().default(0),
  isFeatured:     boolean("is_featured").notNull().default(false),
  boostExpiresAt: timestamp("boost_expires_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("listings_lister_idx").on(t.listerId),
  index("listings_status_idx").on(t.status),
  index("listings_city_idx").on(t.city),
  index("listings_active_city_idx").on(t.status, t.city),
  index("listings_price_idx").on(t.pricePerMonth),
]);

export const listingPhotos = pgTable("listing_photos", {
  id:         uuid("id").primaryKey().defaultRandom(),
  listingId:  uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  url:        text("url").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  altText:    text("alt_text"),
  createdAt:  timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("listing_photos_listing_idx").on(t.listingId),
]);

export type Listing        = typeof listings.$inferSelect;
export type NewListing     = typeof listings.$inferInsert;
export type ListingPhoto   = typeof listingPhotos.$inferSelect;
export type NewListingPhoto = typeof listingPhotos.$inferInsert;