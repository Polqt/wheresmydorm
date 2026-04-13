import { TRPCError } from "@trpc/server";
import { conversationReports, db, postReports, posts } from "@wheresmydorm/db";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { adminProcedure, router } from "../index";
import { moderationStatusValues } from "../lib/moderation";

const moderatePostReportSchema = z.object({
  reportId: z.string().uuid(),
  status: z.enum(moderationStatusValues),
  removePost: z.boolean().optional(),
});

const moderateConversationReportSchema = z.object({
  reportId: z.string().uuid(),
  status: z.enum(moderationStatusValues),
});

export const adminRouter = router({
  listPostReports: adminProcedure.query(async () => {
    return db.query.postReports.findMany({
      orderBy: [desc(postReports.createdAt)],
      with: {
        post: {
          with: {
            author: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }),

  moderatePostReport: adminProcedure
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

  listConversationReports: adminProcedure.query(async () => {
    return db.query.conversationReports.findMany({
      orderBy: [desc(conversationReports.createdAt)],
      with: {
        listing: {
          columns: {
            id: true,
            title: true,
          },
        },
        reporter: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        reportedUser: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }),

  moderateConversationReport: adminProcedure
    .input(moderateConversationReportSchema)
    .mutation(async ({ ctx, input }) => {
      const [updatedReport] = await db
        .update(conversationReports)
        .set({
          reviewedAt: new Date(),
          reviewedBy: ctx.userId,
          status: input.status,
        })
        .where(eq(conversationReports.id, input.reportId))
        .returning();

      if (!updatedReport) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation report not found.",
        });
      }

      return updatedReport;
    }),
});
