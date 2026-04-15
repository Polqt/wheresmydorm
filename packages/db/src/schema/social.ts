import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { reactionTypeEnum, reportReasonEnum, reportStatusEnum } from "./config";
import { listings } from "./listings";
import { profiles } from "./profiles";

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),

    body: text("body").notNull(),
    mediaUrls: jsonb("media_urls").$type<string[]>().notNull().default([]),
    listingId: uuid("listing_id").references(() => listings.id, {
      onDelete: "set null",
    }),
    hashtags: jsonb("hashtags").$type<string[]>().notNull().default([]),

    likeCount: integer("like_count").notNull().default(0),
    commentCount: integer("comment_count").notNull().default(0),
    shareCount: integer("share_count").notNull().default(0),

    isRemoved: boolean("is_removed").notNull().default(false),
    removedAt: timestamp("removed_at", { withTimezone: true }),
    removedBy: uuid("removed_by").references(() => profiles.id),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("posts_author_idx").on(t.authorId),
    index("posts_created_idx").on(t.createdAt),
    index("posts_hashtags_idx").on(t.hashtags),
  ],
);

export const postComments = pgTable(
  "post_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    parentCommentId: uuid("parent_comment_id"), // self-ref added via ALTER TABLE in migration
    isRemoved: boolean("is_removed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("post_comments_post_idx").on(t.postId),
    index("post_comments_parent_idx").on(t.parentCommentId),
  ],
);

export const postReactions = pgTable(
  "post_reactions",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    reaction: reactionTypeEnum("reaction").notNull().default("like"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("post_reactions_unique_idx").on(t.postId, t.userId)],
);

export const postReports = pgTable(
  "post_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    reason: reportReasonEnum("reason").notNull(),
    notes: text("notes"),
    status: reportStatusEnum("status").notNull().default("pending"),
    reviewedBy: uuid("reviewed_by").references(() => profiles.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("post_reports_status_idx").on(t.status)],
);

export const follows = pgTable(
  "follows",
  {
    followerId: uuid("follower_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    followingId: uuid("following_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("follows_follower_idx").on(t.followerId),
    index("follows_following_idx").on(t.followingId),
  ],
);

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type PostComment = typeof postComments.$inferSelect;
export type Follow = typeof follows.$inferSelect;
