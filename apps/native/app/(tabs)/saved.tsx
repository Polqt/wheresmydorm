import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HeartIcon from "@/assets/icons/tabs/heart.svg";

export default function SavedTabScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Saved</Text>
        <Text style={styles.title}>Your saved places</Text>
        <Text style={styles.subtitle}>
          Listings you've hearted will appear here so you can revisit and
          compare them at any time.
        </Text>

        {/* Placeholder empty state */}
        <View style={styles.emptyState}>
          <HeartIcon width={48} height={48} color="#D1C9BB" />
          <Text style={styles.emptyTitle}>Nothing saved yet</Text>
          <Text style={styles.emptyBody}>
            Tap the heart on any listing to save it here for later.
          </Text>
        </View>

        {/* Placeholder cards */}
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.placeholderCard}>
            <View style={styles.placeholderImage} />
            <View style={styles.placeholderContent}>
              <View style={styles.placeholderLine} />
              <View style={[styles.placeholderLine, styles.placeholderLineShort]} />
              <View style={[styles.placeholderLine, styles.placeholderLineThin]} />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f4ee",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 14,
  },
  eyebrow: {
    color: "#EA580C",
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
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
  },
  emptyTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "800",
  },
  emptyBody: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 240,
  },
  placeholderCard: {
    borderRadius: 28,
    backgroundColor: "#fffdf9",
    borderWidth: 1,
    borderColor: "#ece3d8",
    overflow: "hidden",
    flexDirection: "row",
  },
  placeholderImage: {
    width: 96,
    height: 96,
    backgroundColor: "#E7E0D5",
  },
  placeholderContent: {
    flex: 1,
    padding: 16,
    gap: 10,
    justifyContent: "center",
  },
  placeholderLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: "#E7E0D5",
  },
  placeholderLineShort: {
    width: "60%",
  },
  placeholderLineThin: {
    height: 8,
    width: "40%",
  },
});
