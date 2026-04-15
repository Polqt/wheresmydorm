import { db, notifications } from "@wheresmydorm/db";

type CreateNotificationInput = {
  body: string;
  referenceId?: string | null;
  referenceType?: string | null;
  title: string;
  type:
    | "new_message"
    | "review_response"
    | "listing_update"
    | "new_review"
    | "bookmark_update"
    | "price_drop"
    | "new_listing_nearby"
    | "payment_confirmed"
    | "broadcast";
  userId: string;
};

export async function createNotification(input: CreateNotificationInput) {
  const [notification] = await db
    .insert(notifications)
    .values({
      body: input.body,
      referenceId: input.referenceId ?? null,
      referenceType: input.referenceType ?? null,
      title: input.title,
      type: input.type,
      userId: input.userId,
    })
    .returning();

  return notification;
}
