import { createHmac } from "node:crypto";

import { db, listings, payments, profiles } from "@wheresmydorm/db";
import { eq } from "drizzle-orm";

import { createNotification } from "./notifications";

type PaymongoMetadata = {
  listingId?: string;
  paymentId: string;
  type: "finder_upgrade" | "listing_boost" | "listing_fee";
  userId: string;
};

type CreatePaymongoIntentInput = {
  amount: number;
  description: string;
  metadata: PaymongoMetadata;
  paymentMethod?: string;
};

type PaymongoIntentResponse = {
  data?: {
    id?: string;
    attributes?: {
      amount?: number;
      client_key?: string;
      payment_method_allowed?: string[];
      status?: string;
    };
  };
};

type PaymongoPaymentEvent = {
  data?: {
    attributes?: {
      data?: {
        attributes?: {
          amount?: number;
          metadata?: PaymongoMetadata;
          payment_intent_id?: string;
          status?: string;
        };
        id?: string;
      };
      type?: string;
    };
    id?: string;
  };
};

function getRequiredEnv(name: "PAYMONGO_SECRET_KEY" | "PAYMONGO_WEBHOOK_SECRET") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for PayMongo operations.`);
  }

  return value;
}

function getPaymongoBasicAuthHeader() {
  return `Basic ${Buffer.from(`${getRequiredEnv("PAYMONGO_SECRET_KEY")}:`).toString("base64")}`;
}

function toCentavos(amount: number) {
  return Math.round(amount * 100);
}

export async function createPaymongoPaymentIntent(
  input: CreatePaymongoIntentInput,
) {
  const response = await fetch("https://api.paymongo.com/v1/payment_intents", {
    method: "POST",
    headers: {
      accept: "application/json",
      authorization: getPaymongoBasicAuthHeader(),
      "content-type": "application/json",
    },
    body: JSON.stringify({
      data: {
        attributes: {
          amount: toCentavos(input.amount),
          capture_type: "automatic",
          currency: "PHP",
          description: input.description,
          metadata: input.metadata,
          payment_method_allowed: input.paymentMethod
            ? [input.paymentMethod]
            : ["gcash", "paymaya", "card"],
        },
      },
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`PayMongo intent creation failed: ${message}`);
  }

  const payload = (await response.json()) as PaymongoIntentResponse;
  const intentId = payload.data?.id;

  if (!intentId) {
    throw new Error("PayMongo intent creation returned no intent id.");
  }

  return {
    allowedPaymentMethods:
      payload.data?.attributes?.payment_method_allowed ?? [],
    amount: payload.data?.attributes?.amount ?? null,
    clientKey: payload.data?.attributes?.client_key ?? null,
    id: intentId,
    status: payload.data?.attributes?.status ?? null,
  };
}

function extractSignatureCandidates(signatureHeader: string) {
  return signatureHeader
    .split(",")
    .map((part) => part.trim())
    .flatMap((part) => {
      const [, value] = part.split("=");
      return value ? [value.trim()] : [part];
    })
    .filter(Boolean);
}

export function verifyPaymongoWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
) {
  if (!signatureHeader) {
    return false;
  }

  const expectedSignature = createHmac(
    "sha256",
    getRequiredEnv("PAYMONGO_WEBHOOK_SECRET"),
  )
    .update(rawBody)
    .digest("hex");

  const candidates = extractSignatureCandidates(signatureHeader);

  return candidates.some((candidate) => candidate === expectedSignature);
}

export async function markPaymentAsPaid(paymentId: string, paymongoPaymentId?: string | null) {
  const payment = await db.query.payments.findFirst({
    where: eq(payments.id, paymentId),
  });

  if (!payment) {
    throw new Error("Payment not found.");
  }

  if (payment.status === "paid") {
    return payment;
  }

  const [updatedPayment] = await db
    .update(payments)
    .set({
      paidAt: new Date(),
      paymongoPaymentId: paymongoPaymentId ?? payment.paymongoPaymentId,
      status: "paid",
    })
    .where(eq(payments.id, paymentId))
    .returning();

  if (!updatedPayment) {
    throw new Error("Payment update failed.");
  }

  if (payment.type === "finder_upgrade") {
    await db
      .update(profiles)
      .set({ isPaidFinder: true })
      .where(eq(profiles.id, payment.userId));
  }

  if (payment.type === "listing_boost" && payment.listingId) {
    await db
      .update(listings)
      .set({ isFeatured: true })
      .where(eq(listings.id, payment.listingId));
  }

  if (payment.type === "listing_fee" && payment.listingId) {
    await db
      .update(listings)
      .set({ status: "active" })
      .where(eq(listings.id, payment.listingId));
  }

  await createNotification({
    body:
      payment.type === "finder_upgrade"
        ? "Your finder plan is now active."
        : "Your payment has been confirmed.",
    referenceId: updatedPayment.id,
    referenceType: "payment",
    title: "Payment confirmed",
    type: "payment_confirmed",
    userId: payment.userId,
  });

  return updatedPayment;
}

export async function handlePaymongoWebhook(rawBody: string) {
  const payload = JSON.parse(rawBody) as PaymongoPaymentEvent;
  const eventType = payload.data?.attributes?.type ?? null;
  const paymentData = payload.data?.attributes?.data;
  const paymentAttributes = paymentData?.attributes;
  const metadata = paymentAttributes?.metadata;

  if (!metadata?.paymentId) {
    return { ignored: true, reason: "missing_metadata" as const };
  }

  const isPaidEvent =
    eventType === "payment.paid" ||
    paymentAttributes?.status === "paid" ||
    paymentAttributes?.status === "succeeded";

  if (!isPaidEvent) {
    return { ignored: true, reason: "unsupported_event" as const };
  }

  const updatedPayment = await markPaymentAsPaid(
    metadata.paymentId,
    paymentData?.id ?? null,
  );

  return {
    ignored: false,
    paymentId: updatedPayment.id,
  };
}
