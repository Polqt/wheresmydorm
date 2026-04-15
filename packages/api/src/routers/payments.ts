import { TRPCError } from "@trpc/server";
import { db, listings, payments } from "@wheresmydorm/db";
import { and, desc, eq, lt } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { assertFinder, assertLister, assertListingOwner } from "../lib/guards";
import {
  createPaymongoPaymentIntent,
  markPaymentAsPaid,
} from "../lib/paymongo";

const listPaymentsSchema = z.object({
  cursor: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

const createPaymentIntentSchema = z.object({
  amount: z.number().positive(),
  listingId: z.string().uuid().optional(),
  paymentMethod: z.string().trim().max(100).optional(),
  type: z.enum([
    "finder_upgrade",
    "listing_fee",
    "listing_boost",
    "verified_badge",
    "lister_analytics",
  ]),
});

const paymentIdSchema = z.object({
  paymentId: z.string().uuid(),
});

export const paymentsRouter = router({
  list: protectedProcedure
    .input(listPaymentsSchema)
    .query(async ({ ctx, input }) => {
      const cursorDate = input.cursor ? new Date(input.cursor) : null;

      const rows = await db.query.payments.findMany({
        where: and(
          eq(payments.userId, ctx.userId),
          cursorDate ? lt(payments.createdAt, cursorDate) : undefined,
        ),
        orderBy: [desc(payments.createdAt)],
        limit: input.limit + 1,
        with: {
          listing: {
            columns: {
              id: true,
              title: true,
            },
          },
        },
      });

      const hasNextPage = rows.length > input.limit;
      const items = hasNextPage ? rows.slice(0, input.limit) : rows;

      return {
        items,
        nextCursor: hasNextPage
          ? (items[items.length - 1]?.createdAt.toISOString() ?? null)
          : null,
      };
    }),

  createIntent: protectedProcedure
    .input(createPaymentIntentSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.type === "finder_upgrade") {
        assertFinder(ctx, "Only finders can create finder upgrade payments.");
      } else {
        assertLister(ctx, "Only listers can create listing payments.");
      }

      if (input.listingId) {
        if (input.type === "listing_fee" || input.type === "listing_boost") {
          await assertListingOwner({
            listingId: input.listingId,
            message: "Only the listing owner can create this payment.",
            userId: ctx.userId,
          });
        } else {
          const listing = await db.query.listings.findFirst({
            where: eq(listings.id, input.listingId),
            columns: { id: true },
          });

          if (!listing) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Listing not found.",
            });
          }
        }
      }

      const [paymentRecord] = await db
        .insert(payments)
        .values({
          amount: String(input.amount),
          listingId: input.listingId,
          paymentMethod: input.paymentMethod,
          status: "pending",
          type: input.type,
          userId: ctx.userId,
        })
        .returning();

      if (!paymentRecord) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Payment record could not be created.",
        });
      }

      const paymentDescriptions: Record<typeof input.type, string> = {
        finder_upgrade: "Finder Pro upgrade",
        listing_boost: "Listing boost (7 days)",
        listing_fee: "Listing fee",
        verified_badge: "Verified Lister badge",
        lister_analytics: "Lister Analytics (30 days)",
      };

      const intent = await createPaymongoPaymentIntent({
        amount: input.amount,
        description: paymentDescriptions[input.type],
        metadata: {
          listingId: input.listingId,
          paymentId: paymentRecord.id,
          type: input.type,
          userId: ctx.userId,
        },
        paymentMethod: input.paymentMethod,
      });

      const [payment] = await db
        .update(payments)
        .set({
          paymongoPaymentIntentId: intent.id,
          webhookPayload: JSON.stringify({
            allowedPaymentMethods: intent.allowedPaymentMethods,
            status: intent.status,
          }),
        })
        .where(eq(payments.id, paymentRecord.id))
        .returning();

      if (!payment) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Payment intent could not be persisted.",
        });
      }

      return {
        clientKey: intent.clientKey,
        payment,
      };
    }),

  markPaid: protectedProcedure
    .input(paymentIdSchema)
    .mutation(async ({ ctx, input }) => {
      const payment = await db.query.payments.findFirst({
        where: eq(payments.id, input.paymentId),
        columns: { id: true, userId: true },
      });

      if (!payment || payment.userId !== ctx.userId) {
        return null;
      }

      return markPaymentAsPaid(input.paymentId);
    }),
});
