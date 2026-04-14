import { FlashList, type FlashListRef } from "@shopify/flash-list";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { trpc } from "@/utils/api-client";

type Message = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const listRef = useRef<FlashListRef<Message>>(null);

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
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      },
    }),
  );

  const handleSend = () => {
    const text = inputText.trim();

    if (!text || sendMutation.isPending) {
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInputText("");
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

    sendMutation.mutate({
      messages: nextMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Housing Assistant</Text>
        <View style={styles.headerRight} />
      </View>

      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Ask anything about student housing</Text>
          <Text style={styles.emptyBody}>
            Get advice on location, budget, amenities, and what to look for when viewing properties in the Philippines.
          </Text>
        </View>
      ) : (
        <FlashList
          ref={listRef}
          contentContainerStyle={styles.list}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isUser = item.role === "user";

            return (
              <View
                style={[
                  styles.bubble,
                  isUser ? styles.bubbleUser : styles.bubbleAssistant,
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant,
                  ]}
                >
                  {item.content}
                </Text>
              </View>
            );
          }}
        />
      )}

      {sendMutation.isPending ? (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>Assistant is typing...</Text>
        </View>
      ) : null}

      {sendMutation.isError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>
            {sendMutation.error.message || "Failed to send. Try again."}
          </Text>
        </View>
      ) : null}

      <View style={[styles.inputRow, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          editable={!sendMutation.isPending}
          multiline
          onChangeText={setInputText}
          placeholder="Ask about housing..."
          placeholderTextColor="#94A3B8"
          style={styles.input}
          value={inputText}
        />
        <Pressable
          disabled={!inputText.trim() || sendMutation.isPending}
          onPress={handleSend}
          style={[
            styles.sendBtn,
            (!inputText.trim() || sendMutation.isPending) && styles.sendBtnDisabled,
          ]}
        >
          <Text style={styles.sendBtnText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    alignItems: "center",
    backgroundColor: "#F0EBE3",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  backBtnText: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "700",
  },
  bubble: {
    borderRadius: 20,
    marginBottom: 10,
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleAssistant: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderWidth: 1,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 21,
  },
  bubbleTextAssistant: {
    color: "#1E293B",
  },
  bubbleTextUser: {
    color: "#FFFFFF",
  },
  bubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: "#EA580C",
  },
  container: {
    backgroundColor: "#F7F4EE",
    flex: 1,
  },
  emptyBody: {
    color: "#706A5F",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    textAlign: "center",
  },
  emptyState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  errorBanner: {
    backgroundColor: "#FEF2F2",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "600",
  },
  header: {
    alignItems: "center",
    backgroundColor: "#FFFDF9",
    borderBottomColor: "#E7E0D5",
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerRight: {
    width: 36,
  },
  headerTitle: {
    color: "#0F172A",
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 20,
    borderWidth: 1,
    color: "#0F172A",
    flex: 1,
    fontSize: 14,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputRow: {
    alignItems: "flex-end",
    backgroundColor: "#FFFDF9",
    borderTopColor: "#E7E0D5",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sendBtn: {
    alignItems: "center",
    backgroundColor: "#EA580C",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  sendBtnDisabled: {
    backgroundColor: "#D1CFC9",
  },
  sendBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  typingIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  typingText: {
    color: "#94A3B8",
    fontSize: 13,
    fontStyle: "italic",
  },
});
