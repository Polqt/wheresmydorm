import { Pressable, Text, View } from "react-native";

type ErrorRetryProps = {
  onRetry: () => void;
  /** Optional context hint shown as a subtitle. Keep user-facing and generic.
   *  Defaults to a safe fallback. Do NOT pass raw error.message here. */
  context?: string;
};

const CONTEXT_COPY: Record<string, string> = {
  listings: "We couldn't load your listings right now.",
  dashboard: "We couldn't load your dashboard right now.",
  feed: "We couldn't load the feed right now.",
  saved: "We couldn't load your saved places right now.",
  discover: "We couldn't load your discover feed right now.",
  notifications: "We couldn't load your notifications right now.",
  reviews: "We couldn't load your reviews right now.",
  messages: "We couldn't load your messages right now.",
  payments: "We couldn't load your payments right now.",
};

export function ErrorRetry({ onRetry, context }: ErrorRetryProps) {
  const subtitle =
    (context ? CONTEXT_COPY[context] : null) ??
    "We're having trouble connecting. This is on our end, not yours.";

  return (
    <View className="flex-1 items-center justify-center px-8">
      <Text style={{ fontSize: 36 }}>😕</Text>
      <Text className="mt-4 text-center font-bold text-[17px] text-slate-900">
        Something went wrong
      </Text>
      <Text className="mt-2 text-center text-[#706A5F] text-[13px] leading-5">
        {subtitle}
      </Text>
      <Text className="mt-1 text-center text-[#706A5F] text-[13px] leading-5">
        Please check your connection and try again.
      </Text>
      <Pressable
        className="mt-6 rounded-2xl bg-brand-orange px-7 py-3.5"
        onPress={onRetry}
      >
        <Text className="font-bold text-[14px] text-white">Try again</Text>
      </Pressable>
    </View>
  );
}
