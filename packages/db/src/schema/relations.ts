import { relations } from "drizzle-orm";
import { profiles } from "./profiles";
import { listings, listingPhotos } from "./listings";
import { reviews, reviewHelpfulVotes, reviewReports } from "./reviews";
import { posts, postComments, postReactions, postReports, follows } from "./social";
import { conversationReports, inquiryStatuses, messages, userBlocks } from "./messaging";
import { searchEvents, payments, notifications, savedListings, savedSearches } from "./platform";

// ─── profiles ────────────────────────────────────────────────────────────────
export const profilesRelations = relations(profiles, ({ many }) => ({
  listings:        many(listings),
  reviews:         many(reviews),
  posts:           many(posts),
  comments:        many(postComments),
  sentMessages:    many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "receiver" }),
  savedListings:   many(savedListings),
  following:       many(follows, { relationName: "follower" }),
  followers:       many(follows, { relationName: "following" }),
  searchEvents:    many(searchEvents),
  payments:        many(payments),
  notifications:   many(notifications),
  savedSearches:   many(savedSearches),
}));

// ─── listings ─────────────────────────────────────────────────────────────────
export const listingsRelations = relations(listings, ({ one, many }) => ({
  lister:   one(profiles, { fields: [listings.listerId], references: [profiles.id] }),
  photos:   many(listingPhotos),
  reviews:  many(reviews),
  savedBy:  many(savedListings),
}));

export const listingPhotosRelations = relations(listingPhotos, ({ one }) => ({
  listing: one(listings, { fields: [listingPhotos.listingId], references: [listings.id] }),
}));

// ─── reviews ──────────────────────────────────────────────────────────────────
export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  listing:      one(listings,  { fields: [reviews.listingId], references: [listings.id] }),
  finder:       one(profiles,  { fields: [reviews.finderId],  references: [profiles.id] }),
  helpfulVotes: many(reviewHelpfulVotes),
  reports:      many(reviewReports),
}));

export const reviewHelpfulVotesRelations = relations(reviewHelpfulVotes, ({ one }) => ({
  review: one(reviews,  { fields: [reviewHelpfulVotes.reviewId], references: [reviews.id] }),
  user:   one(profiles, { fields: [reviewHelpfulVotes.userId],   references: [profiles.id] }),
}));

export const reviewReportsRelations = relations(reviewReports, ({ one }) => ({
  review:   one(reviews,  { fields: [reviewReports.reviewId],   references: [reviews.id] }),
  reporter: one(profiles, { fields: [reviewReports.reporterId], references: [profiles.id] }),
}));

// ─── social ───────────────────────────────────────────────────────────────────
export const postsRelations = relations(posts, ({ one, many }) => ({
  author:    one(profiles, { fields: [posts.authorId], references: [profiles.id] }),
  listing:   one(listings, { fields: [posts.listingId], references: [listings.id] }),
  comments:  many(postComments),
  reactions: many(postReactions),
  reports:   many(postReports),
}));

export const postCommentsRelations = relations(postComments, ({ one }) => ({
  post:   one(posts,    { fields: [postComments.postId],   references: [posts.id] }),
  author: one(profiles, { fields: [postComments.authorId], references: [profiles.id] }),
}));

export const postReactionsRelations = relations(postReactions, ({ one }) => ({
  post: one(posts,    { fields: [postReactions.postId],  references: [posts.id] }),
  user: one(profiles, { fields: [postReactions.userId], references: [profiles.id] }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower:  one(profiles, { fields: [follows.followerId],  references: [profiles.id], relationName: "follower" }),
  following: one(profiles, { fields: [follows.followingId], references: [profiles.id], relationName: "following" }),
}));

// ─── messaging ────────────────────────────────────────────────────────────────
export const messagesRelations = relations(messages, ({ one }) => ({
  sender:   one(profiles, { fields: [messages.senderId],   references: [profiles.id], relationName: "sender" }),
  receiver: one(profiles, { fields: [messages.receiverId], references: [profiles.id], relationName: "receiver" }),
  listing:  one(listings, { fields: [messages.listingId],  references: [listings.id] }),
}));

export const userBlocksRelations = relations(userBlocks, ({ one }) => ({
  blocker: one(profiles, { fields: [userBlocks.blockerId], references: [profiles.id] }),
  blocked: one(profiles, { fields: [userBlocks.blockedId], references: [profiles.id] }),
}));

export const inquiryStatusesRelations = relations(inquiryStatuses, ({ one }) => ({
  finder: one(profiles, { fields: [inquiryStatuses.finderId], references: [profiles.id] }),
  lister: one(profiles, { fields: [inquiryStatuses.listerId], references: [profiles.id] }),
  listing: one(listings, { fields: [inquiryStatuses.listingId], references: [listings.id] }),
}));

export const conversationReportsRelations = relations(conversationReports, ({ one }) => ({
  listing: one(listings, { fields: [conversationReports.listingId], references: [listings.id] }),
  reporter: one(profiles, { fields: [conversationReports.reporterId], references: [profiles.id] }),
  reportedUser: one(profiles, { fields: [conversationReports.reportedUserId], references: [profiles.id] }),
}));

// ─── platform ─────────────────────────────────────────────────────────────────
export const searchEventsRelations = relations(searchEvents, ({ one }) => ({
  user:    one(profiles, { fields: [searchEvents.userId],    references: [profiles.id] }),
  listing: one(listings, { fields: [searchEvents.listingId], references: [listings.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user:    one(profiles, { fields: [payments.userId],    references: [profiles.id] }),
  listing: one(listings, { fields: [payments.listingId], references: [listings.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(profiles, { fields: [notifications.userId], references: [profiles.id] }),
}));

export const savedListingsRelations = relations(savedListings, ({ one }) => ({
  finder:  one(profiles, { fields: [savedListings.finderId],  references: [profiles.id] }),
  listing: one(listings, { fields: [savedListings.listingId], references: [listings.id] }),
}));

export const savedSearchesRelations = relations(savedSearches, ({ one }) => ({
  finder: one(profiles, { fields: [savedSearches.finderId], references: [profiles.id] }),
}));
