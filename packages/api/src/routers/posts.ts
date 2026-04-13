import { TRPCError } from "@trpc/server";
import {
  db,
  follows,
  postComments,
  postReactions,
  postReports,
  posts,
} from "@wheresmydorm/db";
import { and, asc, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../index";
import { moderationStatusValues, reportReasonValues } from "../lib/moderation";
import { formatProfileName } from "../lib/profile";

const reactionValues = ["like", "helpful", "funny"] as const;
const defaultFeedLimit = 10;

const createPostSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  mediaUrls: z.array(z.string().url()).max(6).default([]),
  listingId: z.string().uuid().optional(),
  hashtags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
});

const feedInputSchema = z.object({
  cursor: z.string().datetime().optional(),
  limit: z.number().int().min(5).max(20).default(defaultFeedLimit),
});

const reactionInputSchema = z.object({
  postId: z.string().uuid(),
  reaction: z.enum(reactionValues),
});

const commentInputSchema = z.object({
  postId: z.string().uuid(),
  body: z.string().trim().min(1).max(1000),
  parentCommentId: z.string().uuid().optional(),
});

const reportInputSchema = z.object({
  postId: z.string().uuid(),
  reason: z.enum(reportReasonValues),
  notes: z.string().trim().max(500).optional(),
});
const moderatePostReportSchema = z.object({
  reportId: z.string().uuid(),
  removePost: z.boolean().optional(),
  status: z.enum(moderationStatusValues),
});

const postIdInputSchema = z.object({
  postId: z.string().uuid(),
});

type ReactionSummaryRow = {
  postId: string;
  reaction: (typeof reactionValues)[number];
  count: number;
};

async function enrichPosts<
  TPost extends {
    id: string;
    authorId: string;
    author: { id: string; displayName: string; avatarUrl: string | null };
  },
>(postList: TPost[], currentUserId: string) {
  if (postList.length === 0) {
    return [];
  }

  const postIds = postList.map((post) => post.id);
  const authorIds = [
    ...new Set(
      postList
        .map((post) => post.authorId)
        .filter((id) => id !== currentUserId),
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
          .select({
            followingId: follows.followingId,
          })
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
    viewerReactions.map((row) => [row.postId, row.reaction] as const),
  );
  const followingSet = new Set(followingRows.map((row) => row.followingId));

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

export const postsRouter = router({
  create: protectedProcedure
    .input(createPostSchema)
    .mutation(async ({ ctx, input }) => {
      const [post] = await db
        .insert(posts)
        .values({
          authorId: ctx.userId,
          body: input.body,
          mediaUrls: input.mediaUrls,
          listingId: input.listingId,
          hashtags: input.hashtags,
        })
        .returning();

      return post;
    }),

  list: protectedProcedure
    .input(feedInputSchema)
    .query(async ({ ctx, input }) => {
      const followingRows = await db
        .select({ followingId: follows.followingId })
        .from(follows)
        .where(eq(follows.followerId, ctx.userId));

      const authorIds = [
        ...new Set([
          ctx.userId,
          ...followingRows.map((row) => row.followingId),
        ]),
      ];
      const cursorDate = input.cursor ? new Date(input.cursor) : null;
      const feedAuthorIds = followingRows.length > 0 ? authorIds : null;

      const postList = await db.query.posts.findMany({
        where: and(
          eq(posts.isRemoved, false),
          feedAuthorIds ? inArray(posts.authorId, feedAuthorIds) : undefined,
          cursorDate ? lt(posts.createdAt, cursorDate) : undefined,
        ),
        orderBy: [desc(posts.createdAt)],
        limit: input.limit + 1,
        with: {
          author: {
            columns: {
              id: true,
              avatarUrl: true,
              firstName: true,
              lastName: true,
            },
          },
          listing: {
            columns: {
              id: true,
              title: true,
            },
          },
        },
      });

      const normalizedPostList = postList.map((post) => ({
        ...post,
        author: {
          avatarUrl: post.author.avatarUrl,
          displayName: formatProfileName({
            firstName: post.author.firstName,
            lastName: post.author.lastName,
          }),
          id: post.author.id,
        },
      }));

      const hasNextPage = normalizedPostList.length > input.limit;
      const items = hasNextPage
        ? normalizedPostList.slice(0, input.limit)
        : normalizedPostList;
      const enrichedItems = await enrichPosts(items, ctx.userId);

      return {
        items: enrichedItems,
        nextCursor: hasNextPage
          ? (items[items.length - 1]?.createdAt.toISOString() ?? null)
          : null,
      };
    }),

  trending: protectedProcedure
    .input(feedInputSchema)
    .query(async ({ ctx, input }) => {
      const cursorDate = input.cursor ? new Date(input.cursor) : null;
      const cutoffDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

      const postList = await db.query.posts.findMany({
        where: and(
          eq(posts.isRemoved, false),
          gte(posts.createdAt, cutoffDate),
          cursorDate ? lt(posts.createdAt, cursorDate) : undefined,
        ),
        orderBy: [
          desc(
            sql`${posts.likeCount} + (${posts.commentCount} * 2) + (${posts.shareCount} * 3)`,
          ),
          desc(posts.createdAt),
        ],
        limit: input.limit + 1,
        with: {
          author: {
            columns: {
              id: true,
              avatarUrl: true,
              firstName: true,
              lastName: true,
            },
          },
          listing: {
            columns: {
              id: true,
              title: true,
            },
          },
        },
      });

      const normalizedPostList = postList.map((post) => ({
        ...post,
        author: {
          avatarUrl: post.author.avatarUrl,
          displayName: formatProfileName({
            firstName: post.author.firstName,
            lastName: post.author.lastName,
          }),
          id: post.author.id,
        },
      }));

      const hasNextPage = normalizedPostList.length > input.limit;
      const items = hasNextPage
        ? normalizedPostList.slice(0, input.limit)
        : normalizedPostList;
      const enrichedItems = await enrichPosts(items, ctx.userId);

      return {
        items: enrichedItems,
        nextCursor: hasNextPage
          ? (items[items.length - 1]?.createdAt.toISOString() ?? null)
          : null,
      };
    }),

  getById: protectedProcedure
    .input(postIdInputSchema)
    .query(async ({ ctx, input }) => {
      const post = await db.query.posts.findFirst({
        where: and(eq(posts.id, input.postId), eq(posts.isRemoved, false)),
        with: {
          author: {
            columns: {
              id: true,
              avatarUrl: true,
              firstName: true,
              lastName: true,
            },
          },
          listing: {
            columns: {
              id: true,
              title: true,
            },
          },
        },
      });

      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found." });
      }

      const [enrichedPost] = await enrichPosts(
        [
          {
            ...post,
            author: {
              avatarUrl: post.author.avatarUrl,
              displayName: formatProfileName({
                firstName: post.author.firstName,
                lastName: post.author.lastName,
              }),
              id: post.author.id,
            },
          },
        ],
        ctx.userId,
      );
      return enrichedPost;
    }),

  getComments: protectedProcedure
    .input(postIdInputSchema)
    .query(async ({ input }) => {
      const comments = await db.query.postComments.findMany({
        where: and(
          eq(postComments.postId, input.postId),
          eq(postComments.isRemoved, false),
        ),
        orderBy: [asc(postComments.createdAt)],
        with: {
          author: {
            columns: {
              id: true,
              avatarUrl: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return comments.map((comment) => ({
        ...comment,
        author: {
          avatarUrl: comment.author.avatarUrl,
          displayName: formatProfileName({
            firstName: comment.author.firstName,
            lastName: comment.author.lastName,
          }),
          id: comment.author.id,
        },
      }));
    }),

  react: protectedProcedure
    .input(reactionInputSchema)
    .mutation(async ({ ctx, input }) => {
      const currentReaction = await db.query.postReactions.findFirst({
        where: and(
          eq(postReactions.postId, input.postId),
          eq(postReactions.userId, ctx.userId),
        ),
      });

      if (!currentReaction) {
        await db.insert(postReactions).values({
          postId: input.postId,
          userId: ctx.userId,
          reaction: input.reaction,
        });
        await db
          .update(posts)
          .set({ likeCount: sql`${posts.likeCount} + 1` })
          .where(eq(posts.id, input.postId));
        return { status: "created" as const };
      }

      if (currentReaction.reaction === input.reaction) {
        await db
          .delete(postReactions)
          .where(
            and(
              eq(postReactions.postId, input.postId),
              eq(postReactions.userId, ctx.userId),
            ),
          );
        await db
          .update(posts)
          .set({ likeCount: sql`${posts.likeCount} - 1` })
          .where(eq(posts.id, input.postId));
        return { status: "removed" as const };
      }

      await db
        .update(postReactions)
        .set({ reaction: input.reaction })
        .where(
          and(
            eq(postReactions.postId, input.postId),
            eq(postReactions.userId, ctx.userId),
          ),
        );

      return { status: "updated" as const };
    }),

  comment: protectedProcedure
    .input(commentInputSchema)
    .mutation(async ({ ctx, input }) => {
      const [comment] = await db
        .insert(postComments)
        .values({
          postId: input.postId,
          authorId: ctx.userId,
          body: input.body,
          parentCommentId: input.parentCommentId,
        })
        .returning();

      await db
        .update(posts)
        .set({ commentCount: sql`${posts.commentCount} + 1` })
        .where(eq(posts.id, input.postId));

      return comment;
    }),

  report: protectedProcedure
    .input(reportInputSchema)
    .mutation(async ({ ctx, input }) => {
      const [report] = await db
        .insert(postReports)
        .values({
          postId: input.postId,
          reporterId: ctx.userId,
          reason: input.reason,
          notes: input.notes,
        })
        .returning();

      return report;
    }),

  listReports: adminProcedure.query(async () => {
    return db.query.postReports.findMany({
      orderBy: [desc(postReports.createdAt)],
      with: {
        post: {
          with: {
            author: {
              columns: {
                id: true,
                avatarUrl: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }),

  moderateReport: adminProcedure
    .input(moderatePostReportSchema)
    .mutation(async ({ ctx, input }) => {
      const [updatedReport] = await db
        .update(postReports)
        .set({
          reviewedAt: new Date(),
          reviewedBy: ctx.userId,
          status: input.status,
        })
        .where(eq(postReports.id, input.reportId))
        .returning();

      if (!updatedReport) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post report not found.",
        });
      }

      if (input.removePost) {
        await db
          .update(posts)
          .set({
            isRemoved: true,
            removedAt: new Date(),
            removedBy: ctx.userId,
          })
          .where(eq(posts.id, updatedReport.postId));
      }

      return updatedReport;
    }),
});
