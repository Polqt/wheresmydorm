import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChatBubble } from "@/components/chat/chat-bubble";
import { useAiChat } from "@/hooks/use-ai-chat";
import type { ChatMessage } from "@/types/chat";

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const {
    errorMessage,
    inputText,
    isPending,
    listRef,
    messages,
    onChangeText,
    onSend,
  } = useAiChat();

  const canSend = Boolean(inputText.trim()) && !isPending;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-[#F7F4EE]"
      style={{ paddingTop: insets.top }}
    >
      {/* Header */}
      <View className="flex-row items-center border-[#E7E0D5] border-b bg-[#FFFDF9] px-4 py-3.5">
        <Pressable
          className="h-9 w-9 items-center justify-center rounded-full bg-[#F0EBE3]"
          onPress={() => router.back()}
        >
          <Text className="font-bold text-lg text-slate-900">←</Text>
        </Pressable>
        <Text className="flex-1 text-center font-extrabold text-base text-slate-900">
          Housing Assistant
        </Text>
        <View className="w-9" />
      </View>

      {/* Message list or empty state */}
      {messages.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center font-extrabold text-[18px] text-slate-900">
            Ask anything about student housing
          </Text>
          <Text className="mt-2 text-center text-[#706A5F] text-[14px] leading-[21px]">
            Get advice on location, budget, amenities, and what to look for when
            viewing properties in the Philippines.
          </Text>
        </View>
      ) : (
        <FlashList
          ref={listRef}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16 }}
          data={messages}
          keyExtractor={(item: ChatMessage) => item.id}
          renderItem={({ item }: { item: ChatMessage }) => (
            <ChatBubble message={item} />
          )}
        />
      )}

      {/* Typing indicator */}
      {isPending ? (
        <View className="px-5 py-2">
          <Text className="text-[13px] text-slate-400 italic">
            Assistant is typing...
          </Text>
        </View>
      ) : null}

      {/* Error banner */}
      {errorMessage ? (
        <View className="mx-4 mb-2 rounded-xl bg-red-50 px-3.5 py-2.5">
          <Text className="font-semibold text-[13px] text-red-700">
            {errorMessage}
          </Text>
        </View>
      ) : null}

      {/* Input row */}
      <View
        className="flex-row items-end gap-2.5 border-[#E7E0D5] border-t bg-[#FFFDF9] px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 8 }}
      >
        <TextInput
          className="flex-1 rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900"
          editable={!isPending}
          maxFontSizeMultiplier={1.3}
          multiline
          onChangeText={onChangeText}
          placeholder="Ask about housing..."
          placeholderTextColor="#94A3B8"
          style={{ maxHeight: 100 }}
          value={inputText}
        />
        <Pressable
          className={`items-center rounded-[20px] px-4 py-3 ${
            canSend ? "bg-brand-orange" : "bg-[#D1CFC9]"
          }`}
          disabled={!canSend}
          onPress={onSend}
        >
          <Text className="font-extrabold text-[13px] text-white">Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
