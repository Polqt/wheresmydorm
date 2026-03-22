import { View } from "react-native";

// This is the initial route. The AuthProvider renders the splash screen
// (animation.gif) over this while it initializes session and routing.
export default function IndexPage() {
  return <View className="flex-1 bg-[#04170E]" />;
}
