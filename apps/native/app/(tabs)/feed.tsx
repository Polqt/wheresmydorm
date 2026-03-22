import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Container } from "@/components/container";

const feedCards = [
  {
    title: "Students compare boarding houses near campus",
    meta: "12 comments - 4 new saves",
    tag: "Popular today",
  },
  {
    title: "Lister spotlight: verified Wi-Fi-ready dorms this month",
    meta: "Editorial - Fresh this week",
    tag: "Editorial",
  },
  {
    title: "Community checklist for safe move-in day",
    meta: "Guides - 7 helpful votes",
    tag: "Guides",
  },
];

export default function FeedTabScreen() {
  return (
    <Container>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Feed</Text>
        <Text style={styles.title}>Community updates worth checking</Text>
        <Text style={styles.subtitle}>
          A lighter activity feed for student housing tips, verified updates,
          and useful local conversation.
        </Text>

        {feedCards.map((card) => (
          <View key={card.title} style={styles.card}>
            <Text style={styles.cardTag}>{card.tag}</Text>
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
    borderRadius: 28,
    backgroundColor: "#fffdf9",
    borderWidth: 1,
    borderColor: "#ece3d8",
    padding: 18,
  },
  cardTag: {
    color: "#0B2D23",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  cardTitle: {
    marginTop: 10,
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "800",
  },
  cardMeta: {
    marginTop: 8,
    color: "#5F5A51",
    fontSize: 13,
  },
});
