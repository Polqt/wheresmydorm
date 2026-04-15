import type React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export function Container({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView className="flex-1 bg-[#F7F4EE]">{children}</SafeAreaView>
  );
}
