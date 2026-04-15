import { env } from "@wheresmydorm/env/native";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

type PaymongoBilling = {
  email: string;
  name: string;
  phone?: string | null;
};

type PaymongoPaymentMethodType = "gcash" | "paymaya";

type PaymongoPaymentMethodResponse = {
  data?: {
    id?: string;
  };
};

type PaymongoAttachResponse = {
  data?: {
    attributes?: {
      next_action?: {
        redirect?: {
          url?: string;
        };
      };
      status?: string;
    };
  };
};

type PaymongoRetrieveIntentResponse = {
  data?: {
    attributes?: {
      last_payment_error?: {
        code?: string;
        detail?: string;
        message?: string;
      };
      next_action?: {
        redirect?: {
          url?: string;
        };
      };
      status?: string;
    };
    id?: string;
  };
};

type RetrievedPaymentIntent = {
  error: string | null;
  redirectUrl: string | null;
  status: string | null;
};

function getPublicAuthHeader() {
  const publicKey = env.EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY;

  if (!publicKey) {
    throw new Error(
      "Missing EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY. Add your PayMongo public key to the native env before using checkout.",
    );
  }

  return `Basic ${encodeBase64(`${publicKey}:`)}`;
}

function encodeBase64(value: string) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  let index = 0;

  while (index < value.length) {
    const byte1 = value.charCodeAt(index++) & 0xff;
    const hasByte2 = index < value.length;
    const byte2 = hasByte2 ? value.charCodeAt(index++) & 0xff : 0;
    const hasByte3 = index < value.length;
    const byte3 = hasByte3 ? value.charCodeAt(index++) & 0xff : 0;

    const chunk = (byte1 << 16) | (byte2 << 8) | byte3;

    result += chars[(chunk >> 18) & 63];
    result += chars[(chunk >> 12) & 63];
    result += hasByte2 ? chars[(chunk >> 6) & 63] : "=";
    result += hasByte3 ? chars[chunk & 63] : "=";
  }

  return result;
}

function getPaymentReturnUrl() {
  return Linking.createURL("payments", {
    scheme: "wheresmydorm",
  });
}

async function paymongoFetch<T>(
  path: string,
  init: RequestInit & { body?: string },
): Promise<T> {
  const response = await fetch(`https://api.paymongo.com${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      authorization: getPublicAuthHeader(),
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`PayMongo request failed: ${message}`);
  }

  return (await response.json()) as T;
}

export async function createPaymongoPaymentMethod(input: {
  billing: PaymongoBilling;
  type: PaymongoPaymentMethodType;
}) {
  const payload = await paymongoFetch<PaymongoPaymentMethodResponse>(
    "/v1/payment_methods",
    {
      body: JSON.stringify({
        data: {
          attributes: {
            billing: {
              email: input.billing.email,
              name: input.billing.name,
              phone: input.billing.phone ?? undefined,
            },
            type: input.type,
          },
        },
      }),
      method: "POST",
    },
  );

  const paymentMethodId = payload.data?.id;

  if (!paymentMethodId) {
    throw new Error("PayMongo did not return a payment method id.");
  }

  return paymentMethodId;
}

export async function attachPaymentMethodToIntent(input: {
  clientKey: string;
  paymentIntentId: string;
  paymentMethodId: string;
}) {
  const payload = await paymongoFetch<PaymongoAttachResponse>(
    `/v1/payment_intents/${input.paymentIntentId}/attach`,
    {
      body: JSON.stringify({
        data: {
          attributes: {
            client_key: input.clientKey,
            payment_method: input.paymentMethodId,
            return_url: getPaymentReturnUrl(),
          },
        },
      }),
      method: "POST",
    },
  );

  return {
    redirectUrl: payload.data?.attributes?.next_action?.redirect?.url ?? null,
    status: payload.data?.attributes?.status ?? null,
  };
}

export async function retrievePaymentIntent(input: {
  clientKey: string;
  paymentIntentId: string;
}): Promise<RetrievedPaymentIntent> {
  const payload = await paymongoFetch<PaymongoRetrieveIntentResponse>(
    `/v1/payment_intents/${input.paymentIntentId}?client_key=${encodeURIComponent(input.clientKey)}`,
    {
      method: "GET",
    },
  );

  return {
    error:
      payload.data?.attributes?.last_payment_error?.message ??
      payload.data?.attributes?.last_payment_error?.detail ??
      null,
    redirectUrl: payload.data?.attributes?.next_action?.redirect?.url ?? null,
    status: payload.data?.attributes?.status ?? null,
  };
}

export async function pollPaymentIntentUntilSettled(
  input: {
    clientKey: string;
    paymentIntentId: string;
  },
  options?: {
    attempts?: number;
    delayMs?: number;
  },
): Promise<RetrievedPaymentIntent> {
  const attempts = options?.attempts ?? 6;
  const delayMs = options?.delayMs ?? 1500;

  let latest = await retrievePaymentIntent(input);

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (
      latest.status === "paid" ||
      latest.status === "succeeded" ||
      latest.status === "failed" ||
      latest.error
    ) {
      return latest;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
    latest = await retrievePaymentIntent(input);
  }

  return latest;
}

export async function openPaymongoRedirectSession(redirectUrl: string) {
  const returnUrl = getPaymentReturnUrl();
  return WebBrowser.openAuthSessionAsync(redirectUrl, returnUrl);
}
