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
import { moderationStatusValues } from "../lib/moderation";
import {
  commentInputSchema,
  createPostSchema,
  enrichPosts,
  feedInputSchema,
  normalizePostAuthor,
  postIdInputSchema,
  reactionInputSchema,
  reportPostInputSchema,
} from "../lib/posts";

const moderatePostReportSchema = z.object({
  reportId: z.string().uuid(),
  removePost: z.boolean().optional(),
  status: z.enum(moderationStatusValues),
});

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
        ...new Set([ctx.userId, ...followingRows.map((r) => r.followingId)]),
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
          listing: { columns: { id: true, title: true } },
        },
      });

      const normalized = postList.map((p) => ({
        ...p,
        author: normalizePostAuthor(p.author),
      }));
      const hasNextPage = normalized.length > input.limit;
      const items = hasNextPage ? normalized.slice(0, input.limit) : normalized;

      return {
        items: await enrichPosts(items, ctx.userId),
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
          listing: { columns: { id: true, title: true } },
        },
      });

      const normalized = postList.map((p) => ({
        ...p,
        author: normalizePostAuthor(p.author),
      }));
      const hasNextPage = normalized.length > input.limit;
      const items = hasNextPage ? normalized.slice(0, input.limit) : normalized;

      return {
        items: await enrichPosts(items, ctx.userId),
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
          listing: { columns: { id: true, title: true } },
        },
      });

      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found." });
      }

      const [enriched] = await enrichPosts(
        [{ ...post, author: normalizePostAuthor(post.author) }],
        ctx.userId,
      );
      return enriched;
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

      return comments.map((c) => ({
        ...c,
        author: normalizePostAuthor(c.author),
      }));
    }),

  react: protectedProcedure
    .input(reactionInputSchema)
    .mutation(async ({ ctx, input }) => {
      const current = await db.query.postReactions.findFirst({
        where: and(
          eq(postReactions.postId, input.postId),
          eq(postReactions.userId, ctx.userId),
        ),
      });

      if (!current) {
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

      if (current.reaction === input.reaction) {
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
    .input(reportPostInputSchema)
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
