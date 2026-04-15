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

      <Text className="mt-6 text-center font-extrabold text-[20px] text-slate-900 tracking-[-0.4px]">
        {title}
      </Text>
      <Text className="mt-2 text-center text-[#706A5F] text-[14px] leading-[22px]">
        {description}
      </Text>

      {action ? (
        <Pressable
          className="mt-6 rounded-2xl bg-brand-orange px-6 py-3.5"
          onPress={action.onPress}
        >
          <Text className="font-bold text-[14px] text-white">
            {action.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
