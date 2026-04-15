import type { FlashListRef } from "@shopify/flash-list";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import type { ChatMessage } from "@/types/chat";
import { trpc } from "@/utils/api-client";

export function useAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const listRef = useRef<FlashListRef<ChatMessage>>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const sendMutation = useMutation(
    trpc.chat.send.mutationOptions({
      onSuccess: (data) => {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.message,
          },
        ]);
        scrollToBottom();
      },
    }),
  );

  const handleSend = useCallback(() => {
    const text = inputText.trim();

    if (!text || sendMutation.isPending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInputText("");
    scrollToBottom();

    sendMutation.mutate({
      messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
    });
  }, [inputText, messages, scrollToBottom, sendMutation]);

  return {
    errorMessage: sendMutation.isError
      ? sendMutation.error.message || "Failed to send. Try again."
      : null,
    inputText,
    isPending: sendMutation.isPending,
    listRef,
    messages,
    onChangeText: setInputText,
    onSend: handleSend,
  };
}
