import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { userRoleEnum } from "./config";

export const profiles = pgTable("profiles", {
  id:           uuid("id").primaryKey(),
  displayName:  text("display_name").notNull(),
  avatarUrl:    text("avatar_url"),
  bio:          text("bio"),
  role:         userRoleEnum("role").notNull().default("finder"),

  isPaidFinder:           boolean("is_paid_finder").notNull().default(false),
  freeSearchesRemaining:  integer("free_searches_remaining").notNull().default(5),
  freeListingsRemaining:  integer("free_listings_remaining").notNull().default(2),
  isVerifiedMember:       boolean("is_verified_member").notNull().default(false),

  contactEmail:     text("contact_email"),
  contactPhone:     text("contact_phone"),
  contactViber:     text("contact_viber"),
  contactMessenger: text("contact_messenger"),

  fcmToken: text("fcm_token"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Profile    = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;