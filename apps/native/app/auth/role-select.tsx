import { useMutation, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/providers/auth-provider";
import { trpc } from "@/utils/trpc";

const roleCards = [
  {
    role: "finder" as const,
    title: "Finder",
    description:
      "Search by map, compare ratings, and use AI to narrow the shortlist.",
  },
  {
    role: "lister" as const,
    title: "Lister",
    description:
      "Publish listings, answer inquiries, and build trust with reviews.",
  },
];

export default function RoleSelectScreen() {
  const { role } = useAuth();
  const profileQuery = useQuery(trpc.profiles.me.queryOptions());
  const setRoleMutation = useMutation(
    trpc.profiles.setRole.mutationOptions({
      onSuccess: () => {
        router.replace("/(tabs)/map");
      },
    }),
  );

  useEffect(() => {
    if (role) {
      router.replace("/(tabs)/map");
    }
  }, [role]);

  return (
    <View style={styles.screen}>
      <Text style={styles.eyebrow}>First login</Text>
      <Text style={styles.title}>Choose your default role</Text>
      <Text style={styles.body}>
        This sets the version of the app we optimize first. You can add more
        profile details after you get inside.
      </Text>

      {profileQuery.error ? (
        <Text style={styles.error}>{profileQuery.error.message}</Text>
      ) : null}

      <View style={styles.cardGrid}>
        {roleCards.map((roleCard) => (
          <View key={roleCard.role} style={styles.roleCard}>
            <Text style={styles.roleTitle}>{roleCard.title}</Text>
            <Text style={styles.roleDescription}>{roleCard.description}</Text>
            <Pressable
              disabled={setRoleMutation.isPending}
              onPress={() => setRoleMutation.mutate({ role: roleCard.role })}
              style={styles.roleButton}
            >
              <Text style={styles.roleButtonText}>
                {setRoleMutation.isPending
                  ? "Saving..."
                  : `Continue as ${roleCard.title}`}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "#f8fafc",
  },
  eyebrow: {
    color: "#0f766e",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 10,
    color: "#0f172a",
    fontSize: 30,
    fontWeight: "800",
  },
  body: {
    marginTop: 12,
    color: "#475569",
    fontSize: 15,
    lineHeight: 24,
  },
  error: {
    marginTop: 12,
    color: "#b91c1c",
    fontSize: 13,
  },
  cardGrid: {
    marginTop: 20,
    gap: 14,
  },
  roleCard: {
    borderRadius: 28,
    backgroundColor: "#ffffff",
    padding: 20,
  },
  roleTitle: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "800",
  },
  roleDescription: {
    marginTop: 10,
    color: "#475569",
    fontSize: 14,
    lineHeight: 22,
  },
  roleButton: {
    marginTop: 18,
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: "#0f172a",
    paddingVertical: 14,
  },
  roleButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
});
