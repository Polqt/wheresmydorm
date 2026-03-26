import { View } from "react-native";

type Props = {
  current: number;
  total: number;
};

export function SetupProgressBar({ current, total }: Props) {
  return (
    <View className="flex-row gap-1.5 px-5 pt-3">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className="h-1 flex-1 rounded-full"
          style={{ backgroundColor: i < current ? "#04170E" : "#E8E3DC" }}
        />
      ))}
    </View>
  );
}
