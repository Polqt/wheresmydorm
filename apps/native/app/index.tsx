import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppLogo } from "@/components/ui/app-logo";

export default function NativeIndexPage() {
  return (
    <SafeAreaView className="flex-1 bg-[#04170E]">
      <StatusBar style="light" />
      <View className="flex-1 items-center justify-center">
        <AppLogo className="h-[120px] w-[120px]" />
      </View>
    </SafeAreaView>
  );
}
