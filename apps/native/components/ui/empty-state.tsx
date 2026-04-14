import { Pressable, Text, View } from "react-native";

type EmptyStateProps = {
  action?: {
    label: string;
    onPress: () => void;
  };
  description: string;
  illustration: string;
  title: string;
};

export function EmptyState({
  action,
  description,
  illustration,
  title,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      {/* Illustration placeholder — large emoji in a warm circle */}
      <View className="h-24 w-24 items-center justify-center rounded-full bg-[#F5F0E8]">
        <Text style={{ fontSize: 40 }}>{illustration}</Text>
      </View>

      <Text className="mt-6 text-center text-[20px] font-extrabold tracking-[-0.4px] text-slate-900">
        {title}
      </Text>
      <Text className="mt-2 text-center text-[14px] leading-[22px] text-[#706A5F]">
        {description}
      </Text>

      {action ? (
        <Pressable
          className="mt-6 rounded-2xl bg-brand-orange px-6 py-3.5"
          onPress={action.onPress}
        >
          <Text className="text-[14px] font-bold text-white">{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
