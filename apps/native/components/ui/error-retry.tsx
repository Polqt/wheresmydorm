import { Pressable, Text, View } from "react-native";

type ErrorRetryProps = {
  message?: string;
  onRetry: () => void;
};

export function ErrorRetry({
  message = "Something went wrong.",
  onRetry,
}: ErrorRetryProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <Text style={{ fontSize: 28 }}>⚠️</Text>
      </View>
      <Text className="mt-4 text-center text-[16px] font-bold text-slate-900">
        {message}
      </Text>
      <Pressable
        className="mt-4 rounded-2xl bg-brand-orange px-6 py-3"
        onPress={onRetry}
      >
        <Text className="text-[14px] font-bold text-white">Try again</Text>
      </Pressable>
    </View>
  );
}
