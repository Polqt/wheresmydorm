import {
  handlePaymongoWebhook,
  verifyPaymongoWebhookSignature,
} from "@wheresmydorm/api/lib/paymongo";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > 1_000_000) {
    return new Response("Payload too large", { status: 413 });
  }

  const rawBody = await req.text();
  const signatureHeader = req.headers.get("Paymongo-Signature");

  const isValid = verifyPaymongoWebhookSignature(rawBody, signatureHeader);

  if (!isValid) {
    return new Response("Invalid signature", { status: 401 });
  }

  try {
    const result = await handlePaymongoWebhook(rawBody);
    return Response.json(result);
  } catch (err) {
    console.error("[webhook] processing error", err);
    return new Response("Webhook processing failed", { status: 500 });
  }
}
