import { db, follows, postReactions } from "@wheresmydorm/db";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { reportReasonValues } from "./moderation";
import { formatProfileName } from "./profile";

export const reactionValues = ["like", "helpful", "funny"] as const;
export const defaultFeedLimit = 10;

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const createPostSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  mediaUrls: z.array(z.string().url()).max(6).default([]),
  listingId: z.string().uuid().optional(),
  hashtags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
});

export const feedInputSchema = z.object({
  cursor: z.string().datetime().optional(),
  limit: z.number().int().min(5).max(20).default(defaultFeedLimit),
});

export const reactionInputSchema = z.object({
  postId: z.string().uuid(),
  reaction: z.enum(reactionValues),
});

export const commentInputSchema = z.object({
  postId: z.string().uuid(),
  body: z.string().trim().min(1).max(1000),
  parentCommentId: z.string().uuid().optional(),
});

export const reportPostInputSchema = z.object({
  postId: z.string().uuid(),
  reason: z.enum(reportReasonValues),
  notes: z.string().trim().max(500).optional(),
});

export const postIdInputSchema = z.object({
  postId: z.string().uuid(),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReactionSummaryRow = {
  postId: string;
  reaction: (typeof reactionValues)[number];
  count: number;
};

type EnrichablePost = {
  id: string;
  authorId: string;
  author: { id: string; displayName: string; avatarUrl: string | null };
};

// ---------------------------------------------------------------------------
// enrichPosts — adds reactionSummary, viewerReaction, author.isFollowing
// ---------------------------------------------------------------------------

export async function enrichPosts<TPost extends EnrichablePost>(
  postList: TPost[],
  currentUserId: string,
) {
  if (postList.length === 0) return [];

  const postIds = postList.map((p) => p.id);
  const authorIds = [
    ...new Set(
      postList.map((p) => p.authorId).filter((id) => id !== currentUserId),
    ),
  ];

  const [reactionRows, viewerReactions, followingRows] = await Promise.all([
    db
      .select({
        postId: postReactions.postId,
        reaction: postReactions.reaction,
        count: sql<number>`count(*)::int`,
      })
      .from(postReactions)
      .where(inArray(postReactions.postId, postIds))
      .groupBy(postReactions.postId, postReactions.reaction),

    db
      .select({
        postId: postReactions.postId,
        reaction: postReactions.reaction,
      })
      .from(postReactions)
      .where(
        and(
          eq(postReactions.userId, currentUserId),
          inArray(postReactions.postId, postIds),
        ),
      ),

    authorIds.length === 0
      ? Promise.resolve([])
      : db
          .select({ followingId: follows.followingId })
          .from(follows)
          .where(
            and(
              eq(follows.followerId, currentUserId),
              inArray(follows.followingId, authorIds),
            ),
          ),
  ]);

  const reactionMap = new Map<
    string,
    Record<(typeof reactionValues)[number], number>
  >();
  for (const row of reactionRows as ReactionSummaryRow[]) {
    const current = reactionMap.get(row.postId) ?? {
      like: 0,
      helpful: 0,
      funny: 0,
    };
    current[row.reaction] = row.count;
    reactionMap.set(row.postId, current);
  }

  const viewerReactionMap = new Map(
    viewerReactions.map((r) => [r.postId, r.reaction] as const),
  );
  const followingSet = new Set(followingRows.map((r) => r.followingId));

  return postList.map((post) => ({
    ...post,
    author: {
      ...post.author,
      isCurrentUser: post.authorId === currentUserId,
      isFollowing:
        post.authorId !== currentUserId && followingSet.has(post.authorId),
    },
    reactionSummary: reactionMap.get(post.id) ?? {
      like: 0,
      helpful: 0,
      funny: 0,
    },
    viewerReaction: viewerReactionMap.get(post.id) ?? null,
  }));
}

// ---------------------------------------------------------------------------
// Normalize author columns from DB row to display shape
// ---------------------------------------------------------------------------

export function normalizePostAuthor(author: {
  id: string;
  avatarUrl: string | null;
  firstName: string;
  lastName: string | null;
}) {
  return {
    avatarUrl: author.avatarUrl,
    displayName: formatProfileName({
      firstName: author.firstName,
      lastName: author.lastName,
    }),
    id: author.id,
  };
}
