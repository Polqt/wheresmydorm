import type { NextRequest } from "next/server";

import {
  handlePaymongoWebhook,
  verifyPaymongoWebhookSignature,
} from "@wheresmydorm/api/lib/paymongo";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signatureHeader = req.headers.get("Paymongo-Signature");

  const isValid = verifyPaymongoWebhookSignature(rawBody, signatureHeader);

  if (!isValid) {
    return new Response("Invalid signature", { status: 401 });
  }

  try {
    const result = await handlePaymongoWebhook(rawBody);
    return Response.json(result);
  } catch {
    return new Response("Webhook processing failed", { status: 500 });
  }
}
