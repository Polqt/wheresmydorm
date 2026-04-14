import { Text, View } from "react-native";

import type { ChatMessage } from "@/types/chat";

type ChatBubbleProps = {
  message: ChatMessage;
};

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <View
      className={`mb-2.5 max-w-[80%] rounded-[20px] px-3.5 py-2.5 ${
        isUser
          ? "ml-auto bg-brand-orange"
          : "mr-auto border border-slate-200 bg-white"
      }`}
    >
      <Text
        className={`text-[14px] leading-[21px] ${
          isUser ? "text-white" : "text-slate-800"
        }`}
      >
        {message.content}
      </Text>
    </View>
  );
}
