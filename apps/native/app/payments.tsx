import FontAwesome from "@expo/vector-icons/FontAwesome";
import { FlashList } from "@shopify/flash-list";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCurrentProfile } from "@/hooks/use-current-profile";
import { useAuth } from "@/providers/auth-provider";
import {
  attachPaymentMethodToIntent,
  createPaymongoPaymentMethod,
  openPaymongoRedirectSession,
  pollPaymentIntentUntilSettled,
} from "@/services/paymongo";
import type { MyListing } from "@/types/listings";
import type { CheckoutStatus, CheckoutStatusTone } from "@/types/payments";
import type {
  PaymentCreateIntentInput,
  PaymentListItem,
} from "@/types/platform";
import { trpc } from "@/utils/api-client";
import { formatCurrency } from "@/utils/profile";

const PAYMENT_METHODS = ["gcash", "paymaya"] as const;

function getPaymentLabel(payment: PaymentListItem) {
  switch (payment.type) {
    case "finder_upgrade":
      return "Finder upgrade";
    case "listing_boost":
      return "Listing boost";
    default:
      return "Listing fee";
  }
}

function getPaymentTone(status: PaymentListItem["status"]) {
  switch (status) {
    case "paid":
      return { bg: "#E8F3EE", text: "#0B4A30" };
    case "pending":
      return { bg: "#FFF3E0", text: "#B45309" };
    case "failed":
      return { bg: "#FDECEC", text: "#B42318" };
    default:
      return { bg: "#F1ECE5", text: "#746C61" };
  }
}

function getWalletFailureMessage(
  method: (typeof PAYMENT_METHODS)[number],
  error: string,
) {
  const normalized = error.toLowerCase();

  if (normalized.includes("cancel")) {
    return `${method.toUpperCase()} checkout was cancelled before payment was confirmed.`;
  }

  if (normalized.includes("expired")) {
    return `${method.toUpperCase()} session expired. Create a new payment intent and try again.`;
  }

  if (normalized.includes("insufficient") || normalized.includes("balance")) {
    return `${method.toUpperCase()} reported insufficient wallet balance.`;
  }

  if (
    normalized.includes("phone") ||
    normalized.includes("mobile") ||
    normalized.includes("number")
  ) {
    return `${method.toUpperCase()} rejected the mobile number used for billing. Check the profile contact number and try again.`;
  }

  if (
    normalized.includes("authentication") ||
    normalized.includes("otp") ||
    normalized.includes("authorize")
  ) {
    return `${method.toUpperCase()} authentication did not complete. Retry and finish the wallet confirmation step.`;
  }

  return `${method.toUpperCase()} checkout did not complete: ${error}`;
}

function getCheckoutTone(
  kind: "error" | "info" | "pending" | "success",
): CheckoutStatusTone {
  switch (kind) {
    case "success":
      return { bg: "#E8F3EE", border: "#C8E1D4", text: "#0B4A30" };
    case "pending":
      return { bg: "#FFF7E6", border: "#F5D7A1", text: "#9A5B00" };
    case "error":
      return { bg: "#FDECEC", border: "#F5C2C0", text: "#B42318" };
    default:
      return { bg: "#EEF4FF", border: "#C7D7F8", text: "#1D4ED8" };
  }
}

export default function PaymentsScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { role, user } = useAuth();
  const profileQuery = useCurrentProfile(user);
  const [selectedMethod, setSelectedMethod] =
    useState<(typeof PAYMENT_METHODS)[number]>("gcash");
  const [latestIntentMethod, setLatestIntentMethod] = useState<
    (typeof PAYMENT_METHODS)[number] | null
  >(null);
  const [latestClientKey, setLatestClientKey] = useState<string | null>(null);
  const [isAttaching, setIsAttaching] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus | null>(
    null,
  );

  const paymentsQuery = useQuery(
    trpc.payments.list.queryOptions({ limit: 50 }),
  );
  const listingsQuery = useQuery({
    ...trpc.listings.myListings.queryOptions(),
    enabled: role === "lister",
  });
  const listerQuotaQuery = useQuery({
    ...trpc.listings.listerQuotaStatus.queryOptions(),
    enabled: role === "lister",
  });
  const finderQuotaQuery = useQuery({
    ...trpc.listings.findQuotaStatus.queryOptions(),
    enabled: role === "finder",
  });

  const createIntent = useMutation(
    trpc.payments.createIntent.mutationOptions({
      onSuccess: async (result) => {
        setLatestClientKey(result.clientKey ?? null);
        setCheckoutStatus(
          result.clientKey
            ? {
                body: "The payment intent is ready. Attach your selected wallet to continue checkout.",
                title: "Intent created",
                tone: getCheckoutTone("info"),
              }
            : null,
        );

        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["trpc", "payments", "list"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["trpc", "listings", "myListings"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["trpc", "listings", "listerQuotaStatus"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["trpc", "listings", "findQuotaStatus"],
          }),
        ]);

        Alert.alert(
          "Payment intent created",
          result.clientKey
            ? `Selected ${selectedMethod.toUpperCase()}. The backend returned a PayMongo client key for the attach step.`
            : "The backend created a PayMongo intent, but no client key was returned.",
        );
      },
    }),
  );
  const markPaid = useMutation(trpc.payments.markPaid.mutationOptions());

  const firstBoostableListing = useMemo(
    () => (listingsQuery.data?.[0] as MyListing | undefined) ?? undefined,
    [listingsQuery.data],
  );
  const firstPayableListing = useMemo(
    () =>
      (listingsQuery.data ?? []).find(
        (listing) =>
          listing.requiresListingFee && listing.listingFeeStatus !== "paid",
      ) as MyListing | undefined,
    [listingsQuery.data],
  );

  const startPayment = (input: PaymentCreateIntentInput) => {
    setCheckoutStatus(null);
    if (input.paymentMethod === "gcash" || input.paymentMethod === "paymaya") {
      setLatestIntentMethod(input.paymentMethod);
    } else {
      setLatestIntentMethod(null);
    }
    createIntent.mutate(input);
  };

  const refreshPaymentState = async (paymentId: string) => {
    await markPaid.mutateAsync({
      paymentId,
    });

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["trpc", "payments", "list"] }),
      queryClient.invalidateQueries({
        queryKey: ["trpc", "listings", "myListings"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["trpc", "listings", "listerQuotaStatus"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["trpc", "listings", "findQuotaStatus"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["trpc", "notifications", "list"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["trpc", "notifications", "unreadCount"],
      }),
    ]);
  };

  const handleAttachPaymentMethod = async () => {
    const latestIntent = createIntent.data;
    const walletMethod = latestIntentMethod ?? selectedMethod;

    if (
      !latestIntent?.clientKey ||
      !latestIntent.payment.paymongoPaymentIntentId
    ) {
      setCheckoutStatus({
        body: "Start a payment first so the app has a PayMongo client key and payment intent to attach.",
        title: "Create an intent first",
        tone: getCheckoutTone("error"),
      });
      return;
    }

    if (!user?.email) {
      setCheckoutStatus({
        body: "Your account needs an email address before checkout can continue.",
        title: "Missing email",
        tone: getCheckoutTone("error"),
      });
      return;
    }

    if (!profileQuery.data?.contactPhone) {
      setCheckoutStatus({
        body: "Add your phone number in Profile before using GCash or Maya checkout.",
        title: "Missing contact number",
        tone: getCheckoutTone("error"),
      });
      return;
    }

    setIsAttaching(true);
    setCheckoutStatus({
      body: `Creating ${walletMethod.toUpperCase()} checkout and waiting for wallet confirmation.`,
      title: "Connecting wallet",
      tone: getCheckoutTone("pending"),
    });

    try {
      const paymentMethodId = await createPaymongoPaymentMethod({
        billing: {
          email: user.email,
          name: profileQuery.data.fullName,
          phone: profileQuery.data.contactPhone,
        },
        type: walletMethod,
      });

      const attachment = await attachPaymentMethodToIntent({
        clientKey: latestIntent.clientKey,
        paymentIntentId: latestIntent.payment.paymongoPaymentIntentId,
        paymentMethodId,
      });

      if (attachment.redirectUrl) {
        const sessionResult = await openPaymongoRedirectSession(
          attachment.redirectUrl,
        );

        if (sessionResult.type === "cancel") {
          setCheckoutStatus({
            body: `${walletMethod.toUpperCase()} checkout was cancelled before confirmation.`,
            title: "Checkout cancelled",
            tone: getCheckoutTone("error"),
          });
          return;
        }

        if (sessionResult.type !== "success") {
          throw new Error("Checkout did not complete in the browser.");
        }
      }

      setCheckoutStatus({
        body: `Waiting for ${walletMethod.toUpperCase()} to finalize the payment. This usually takes a few seconds.`,
        title: "Checking payment status",
        tone: getCheckoutTone("pending"),
      });

      const intent = await pollPaymentIntentUntilSettled({
        clientKey: latestIntent.clientKey,
        paymentIntentId: latestIntent.payment.paymongoPaymentIntentId,
      });

      if (intent.status === "succeeded" || intent.status === "paid") {
        await refreshPaymentState(latestIntent.payment.id);
        setCheckoutStatus({
          body: "The payment completed and the app refreshed your billing state.",
          title: "Payment confirmed",
          tone: getCheckoutTone("success"),
        });
        return;
      }

      if (intent.status === "awaiting_next_action" && intent.redirectUrl) {
        setCheckoutStatus({
          body: `${walletMethod.toUpperCase()} still needs confirmation in the external wallet app. Finish that step, then check again or retry.`,
          title: "Authentication still required",
          tone: getCheckoutTone("pending"),
        });
        return;
      }

      if (intent.error) {
        setCheckoutStatus({
          body: getWalletFailureMessage(walletMethod, intent.error),
          title: `${walletMethod.toUpperCase()} checkout failed`,
          tone: getCheckoutTone("error"),
        });
        return;
      }

      setCheckoutStatus({
        body: "The payment intent was attached, but PayMongo has not marked it paid yet. You can wait a moment and retry checking status.",
        title: "Payment still pending",
        tone: getCheckoutTone("pending"),
      });
    } catch {
      setCheckoutStatus({
        body: "We couldn't complete your checkout. Please try again or use a different payment method.",
        title: "Checkout failed",
        tone: getCheckoutTone("error"),
      });
    } finally {
      setIsAttaching(false);
    }
  };

  const handleCheckStatusAgain = async () => {
    const latestIntent = createIntent.data;
    const walletMethod = latestIntentMethod ?? selectedMethod;

    if (
      !latestIntent?.clientKey ||
      !latestIntent.payment.paymongoPaymentIntentId
    ) {
      setCheckoutStatus({
        body: "Create and attach a payment intent first before checking its status again.",
        title: "No pending payment",
        tone: getCheckoutTone("error"),
      });
      return;
    }

    setIsCheckingStatus(true);
    setCheckoutStatus({
      body: `Re-checking ${walletMethod.toUpperCase()} payment status with PayMongo.`,
      title: "Checking payment status",
      tone: getCheckoutTone("pending"),
    });

    try {
      const intent = await pollPaymentIntentUntilSettled(
        {
          clientKey: latestIntent.clientKey,
          paymentIntentId: latestIntent.payment.paymongoPaymentIntentId,
        },
        {
          attempts: 4,
          delayMs: 1500,
        },
      );

      if (intent.status === "succeeded" || intent.status === "paid") {
        await refreshPaymentState(latestIntent.payment.id);
        setCheckoutStatus({
          body: "The payment completed and the app refreshed your billing state.",
          title: "Payment confirmed",
          tone: getCheckoutTone("success"),
        });
        return;
      }

      if (intent.status === "awaiting_next_action" && intent.redirectUrl) {
        setCheckoutStatus({
          body: `${walletMethod.toUpperCase()} still needs confirmation in the external wallet app. Finish that step, then check again.`,
          title: "Authentication still required",
          tone: getCheckoutTone("pending"),
        });
        return;
      }

      if (intent.error) {
        setCheckoutStatus({
          body: getWalletFailureMessage(walletMethod, intent.error),
          title: `${walletMethod.toUpperCase()} checkout failed`,
          tone: getCheckoutTone("error"),
        });
        return;
      }

      setCheckoutStatus({
        body: "PayMongo still shows this payment as pending. Wait a few seconds and check again if the wallet flow was already completed.",
        title: "Payment still pending",
        tone: getCheckoutTone("pending"),
      });
    } catch {
      setCheckoutStatus({
        body: "We couldn't verify your payment status right now. Please wait a moment and try again.",
        title: "Status check failed",
        tone: getCheckoutTone("error"),
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome name="arrow-left" size={16} color="#0f172a" />
        </Pressable>
        <Text style={styles.headerTitle}>Payments</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Billing and upgrades</Text>
        <Text style={styles.summaryBody}>
          Choose a payment method, create the next PayMongo intent, and inspect
          paid versus pending activity.
        </Text>
      </View>

      <View style={styles.methodSection}>
        <Text style={styles.sectionLabel}>Payment method</Text>
        <View style={styles.methodRow}>
          {PAYMENT_METHODS.map((method) => {
            const selected = method === selectedMethod;

            return (
              <Pressable
                key={method}
                onPress={() => setSelectedMethod(method)}
                style={[
                  styles.methodChip,
                  selected && styles.methodChipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.methodChipText,
                    selected && styles.methodChipTextSelected,
                  ]}
                >
                  {method.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {role === "finder" ? (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            {finderQuotaQuery.data?.isPaid
              ? "Finder plan active"
              : "Free finder plan"}
          </Text>
          <Text style={styles.infoBody}>
            {finderQuotaQuery.data?.isPaid
              ? "Unlimited nearby finds and advanced filters are enabled."
              : `${finderQuotaQuery.data?.remainingFinds ?? 0} lifetime finds remain before an upgrade is needed.`}
          </Text>
        </View>
      ) : null}

      {role === "lister" ? (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            {listerQuotaQuery.data?.remainingFreeListings ?? 0} free listing
            slots left
          </Text>
          <Text style={styles.infoBody}>
            {listerQuotaQuery.data?.pendingListingFeesCount ?? 0} listings are
            waiting on fee payment and{" "}
            {listerQuotaQuery.data?.paidListingFeesCount ?? 0} paid listing fees
            are already cleared.
          </Text>
        </View>
      ) : null}

      {latestClientKey ? (
        <View style={styles.clientKeyCard}>
          <Text style={styles.sectionLabel}>Latest PayMongo client key</Text>
          <Text style={styles.clientKeyValue} numberOfLines={3}>
            {latestClientKey}
          </Text>
          <Text style={styles.clientKeyHelp}>
            This is the handoff value for the next payment-method attach step.
          </Text>
          <Pressable
            disabled={isAttaching || !profileQuery.data?.contactPhone}
            onPress={handleAttachPaymentMethod}
            style={[
              styles.attachButton,
              (isAttaching || !profileQuery.data?.contactPhone) &&
                styles.attachButtonDisabled,
            ]}
          >
            <Text style={styles.attachButtonText}>
              {isAttaching
                ? "Attaching..."
                : `Attach ${(latestIntentMethod ?? selectedMethod).toUpperCase()} now`}
            </Text>
          </Pressable>
          <Pressable
            disabled={isCheckingStatus || isAttaching}
            onPress={handleCheckStatusAgain}
            style={[
              styles.secondaryButton,
              (isCheckingStatus || isAttaching) &&
                styles.secondaryButtonDisabled,
            ]}
          >
            <Text style={styles.secondaryButtonText}>
              {isCheckingStatus ? "Checking..." : "Check status again"}
            </Text>
          </Pressable>
          {!profileQuery.data?.contactPhone ? (
            <Text style={styles.attachHelpText}>
              Add a contact number in Profile first. PayMongo e-wallet checkout
              needs it.
            </Text>
          ) : null}
        </View>
      ) : null}

      {checkoutStatus ? (
        <View
          style={[
            styles.checkoutStatusCard,
            {
              backgroundColor: checkoutStatus.tone.bg,
              borderColor: checkoutStatus.tone.border,
            },
          ]}
        >
          <Text
            style={[
              styles.checkoutStatusTitle,
              { color: checkoutStatus.tone.text },
            ]}
          >
            {checkoutStatus.title}
          </Text>
          <Text
            style={[
              styles.checkoutStatusBody,
              { color: checkoutStatus.tone.text },
            ]}
          >
            {checkoutStatus.body}
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        {role === "finder" ? (
          <Pressable
            disabled={createIntent.isPending}
            onPress={() =>
              startPayment({
                amount: 199,
                paymentMethod: selectedMethod,
                type: "finder_upgrade",
              })
            }
            style={styles.actionCard}
          >
            <Text style={styles.actionTitle}>Upgrade finder plan</Text>
            <Text style={styles.actionBody}>
              Creates a PayMongo intent for the P199 finder upgrade.
            </Text>
          </Pressable>
        ) : null}

        {role === "lister" ? (
          <>
            <Pressable
              disabled={createIntent.isPending || !firstPayableListing}
              onPress={() =>
                firstPayableListing
                  ? startPayment({
                      amount: 150,
                      listingId: firstPayableListing.id,
                      paymentMethod: selectedMethod,
                      type: "listing_fee",
                    })
                  : undefined
              }
              style={styles.actionCard}
            >
              <Text style={styles.actionTitle}>Pay listing fee</Text>
              <Text style={styles.actionBody}>
                Uses your next unpaid listing as the linked billing record.
              </Text>
            </Pressable>

            <Pressable
              disabled={createIntent.isPending || !firstBoostableListing}
              onPress={() =>
                firstBoostableListing
                  ? startPayment({
                      amount: 99,
                      listingId: firstBoostableListing.id,
                      paymentMethod: selectedMethod,
                      type: "listing_boost",
                    })
                  : undefined
              }
              style={styles.actionCard}
            >
              <Text style={styles.actionTitle}>Create boost payment</Text>
              <Text style={styles.actionBody}>
                Creates a boost intent for your first listing.
              </Text>
            </Pressable>
          </>
        ) : null}
      </View>

      <FlashList
        contentContainerStyle={styles.list}
        data={paymentsQuery.data?.items ?? []}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No payments yet</Text>}
        renderItem={({ item }) => {
          const tone = getPaymentTone(item.status);

          return (
            <View style={styles.row}>
              <View style={styles.rowCopy}>
                <View style={styles.rowHeader}>
                  <Text style={styles.rowTitle}>{getPaymentLabel(item)}</Text>
                  <View
                    style={[styles.statusBadge, { backgroundColor: tone.bg }]}
                  >
                    <Text
                      style={[styles.statusBadgeText, { color: tone.text }]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.rowBody}>
                  {new Date(String(item.createdAt)).toLocaleDateString("en-US")}
                  {item.paymentMethod
                    ? ` • ${String(item.paymentMethod).toUpperCase()}`
                    : ""}
                </Text>
              </View>
              <Text style={styles.rowAmount}>
                {formatCurrency(item.amount)}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actionBody: {
    color: "#706A5F",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  attachButton: {
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  attachButtonDisabled: {
    backgroundColor: "#B8B3AB",
  },
  attachButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  attachHelpText: {
    color: "#8B857C",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 8,
  },
  actionCard: {
    backgroundColor: "#fffdf9",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  actionTitle: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "800",
  },
  actions: {
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  backBtn: {
    alignItems: "center",
    backgroundColor: "#F0EBE3",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  clientKeyCard: {
    backgroundColor: "#fffdf9",
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  clientKeyHelp: {
    color: "#706A5F",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  clientKeyValue: {
    color: "#0f172a",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
  },
  checkoutStatusBody: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  checkoutStatusCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  checkoutStatusTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  container: {
    backgroundColor: "#f7f4ee",
    flex: 1,
  },
  empty: {
    color: "#9E9890",
    fontSize: 13,
    fontWeight: "600",
    paddingVertical: 32,
    textAlign: "center",
  },
  header: {
    alignItems: "center",
    backgroundColor: "#fffdf9",
    borderBottomColor: "#E7E0D5",
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerRight: {
    width: 36,
  },
  headerTitle: {
    color: "#0f172a",
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  infoBody: {
    color: "#5C564D",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: "#EEF5F1",
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoTitle: {
    color: "#0B2D23",
    fontSize: 14,
    fontWeight: "800",
  },
  list: {
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  methodChip: {
    backgroundColor: "#EDE8DF",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  methodChipSelected: {
    backgroundColor: "#111827",
  },
  methodChipText: {
    color: "#5F584E",
    fontSize: 12,
    fontWeight: "800",
  },
  methodChipTextSelected: {
    color: "#FFFFFF",
  },
  methodRow: {
    flexDirection: "row",
    gap: 8,
  },
  methodSection: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  row: {
    alignItems: "center",
    backgroundColor: "#fffdf9",
    borderRadius: 20,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowAmount: {
    color: "#0B2D23",
    fontSize: 13,
    fontWeight: "800",
  },
  rowBody: {
    color: "#706A5F",
    fontSize: 12,
    marginTop: 4,
  },
  rowCopy: {
    flex: 1,
  },
  rowHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  rowTitle: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "700",
  },
  sectionLabel: {
    color: "#706A5F",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#EDE8DF",
    borderRadius: 16,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  secondaryButtonDisabled: {
    backgroundColor: "#D8D2C9",
  },
  secondaryButtonText: {
    color: "#1F2937",
    fontSize: 12,
    fontWeight: "800",
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  summary: {
    backgroundColor: "#fffdf9",
    borderRadius: 24,
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  summaryBody: {
    color: "#706A5F",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  summaryTitle: {
    color: "#0f172a",
    fontSize: 20,
    fontWeight: "800",
  },
});
