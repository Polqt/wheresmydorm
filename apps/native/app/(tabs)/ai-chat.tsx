import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Container } from "@/components/container";

const suggestionPrompts = [
  "Find a quiet dorm near La Salle Bacolod under P6,000.",
  "Show me listings with CCTV, Wi-Fi, and a strong safety rating.",
  "Compare bedspaces and studios within 3 km of the city center.",
];

export default function AiChatTabScreen() {
  return (
    <Container>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>AI Chat</Text>
        <Text style={styles.title}>Ask for smarter dorm recommendations</Text>
        <Text style={styles.subtitle}>
          The chat workflow is scaffolded here so the tab architecture matches
          the PRD before the Claude-powered recommendation layer lands.
        </Text>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Suggested prompts</Text>
          {suggestionPrompts.map((prompt) => (
            <Pressable key={prompt} style={styles.promptCard}>
              <Text style={styles.promptText}>{prompt}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  eyebrow: {
    color: "#0f766e",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 8,
    color: "#0f172a",
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 10,
    color: "#475569",
    fontSize: 14,
    lineHeight: 22,
  },
  panel: {
    marginTop: 20,
    borderRadius: 28,
    backgroundColor: "#ecfeff",
    padding: 18,
  },
  panelTitle: {
    color: "#155e75",
    fontSize: 16,
    fontWeight: "800",
  },
  promptCard: {
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    padding: 14,
  },
  promptText: {
    color: "#334155",
    fontSize: 14,
    lineHeight: 20,
  },
});
