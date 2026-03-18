import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Container } from "@/components/container";

const feedCards = [
  {
    title: "Students compare boarding houses near campus",
    meta: "12 comments • 4 new saves",
  },
  {
    title: "Lister spotlight: verified Wi-Fi-ready dorms this month",
    meta: "Editorial • Fresh this week",
  },
  {
    title: "Community checklist for safe move-in day",
    meta: "Guides • 7 helpful votes",
  },
];

export default function FeedTabScreen() {
  return (
    <Container>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Feed</Text>
        <Text style={styles.title}>
          Community activity and housing conversations
        </Text>
        <Text style={styles.subtitle}>
          Posts, comments, and follows are modeled in the database already, so
          this tab gives the product structure a place to grow into.
        </Text>

        {feedCards.map((card) => (
          <View key={card.title} style={styles.card}>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardMeta}>{card.meta}</Text>
          </View>
        ))}
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 18,
    paddingVertical: 20,
    gap: 14,
  },
  eyebrow: {
    color: "#0f766e",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  title: {
    color: "#0f172a",
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 22,
  },
  card: {
    borderRadius: 24,
    backgroundColor: "#ecfeff",
    padding: 18,
  },
  cardTitle: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "800",
  },
  cardMeta: {
    marginTop: 8,
    color: "#155e75",
    fontSize: 13,
  },
});
