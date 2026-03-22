import { useQuery } from "@tanstack/react-query";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Container } from "@/components/container";
import { useAuth } from "@/providers/auth-provider";
import { getOrCreateCurrentProfile } from "@/services/profile";

export default function ProfileTabScreen() {
  const { signOut, user, role } = useAuth();
  const profileQuery = useQuery({
    enabled: Boolean(user),
    queryFn: () => getOrCreateCurrentProfile(user!),
    queryKey: ["auth-profile", user?.id],
  });

  return (
    <Container>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Profile</Text>
        <Text style={styles.title}>Account setup and role controls</Text>
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Signed in as</Text>
          <Text style={styles.heroTitle}>
            {profileQuery.data?.displayName ?? user?.email ?? "Member"}
          </Text>
          <Text style={styles.heroBody}>
            Current role: {role ?? "Role selection pending"}
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Profile sync</Text>
          <Text style={styles.infoBody}>
            The role and account profile are now read directly from Supabase in
            the native app.
          </Text>
        </View>

        <Pressable onPress={signOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
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
  heroCard: {
    borderRadius: 28,
    backgroundColor: "#fff7ed",
    padding: 20,
  },
  heroLabel: {
    color: "#9a3412",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroTitle: {
    marginTop: 10,
    color: "#0f172a",
    fontSize: 24,
    fontWeight: "800",
  },
  heroBody: {
    marginTop: 6,
    color: "#475569",
    fontSize: 14,
    lineHeight: 22,
  },
  infoCard: {
    borderRadius: 22,
    backgroundColor: "#f8fafc",
    padding: 18,
  },
  infoTitle: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "800",
  },
  infoBody: {
    marginTop: 8,
    color: "#475569",
    fontSize: 14,
    lineHeight: 22,
  },
  signOutButton: {
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: "#0f172a",
    paddingVertical: 14,
  },
  signOutText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
});
