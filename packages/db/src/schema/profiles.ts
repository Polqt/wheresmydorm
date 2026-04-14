import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { userRoleEnum } from "./config";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  avatarUrl: text("avatar_url"),
  role: userRoleEnum("role"),

  isPaidFinder: boolean("is_paid_finder").notNull().default(false),
  isVerifiedMember: boolean("is_verified_member").notNull().default(false),
  isVerifiedLister: boolean("is_verified_lister").notNull().default(false),
  analyticsExpiresAt: timestamp("analytics_expires_at", { withTimezone: true }),

  bio: text("bio"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),

  preferredArea: text("preferred_area"),
  finderBudgetMin: text("finder_budget_min"),
  finderBudgetMax: text("finder_budget_max"),
  finderPropertyTypes: text("finder_property_types")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  propertyTypes: text("property_types")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  listerPropertyCount: integer("lister_property_count"),

  fcmToken: text("fcm_token"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
