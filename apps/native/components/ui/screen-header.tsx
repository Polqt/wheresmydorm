import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type ScreenHeaderProps = {
  action?: ReactNode;
  subtitle?: string;
  title: string;
  withBackButton?: boolean;
};

export function ScreenHeader({
  action,
  subtitle,
  title,
  withBackButton = false,
}: ScreenHeaderProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {withBackButton ? (
          <Pressable
            hitSlop={8}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons color="#1A1A1A" name="chevron-back" size={20} />
          </Pressable>
        ) : null}

        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? (
            <Text numberOfLines={2} style={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {action ? <View style={styles.action}>{action}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,
  },
  row: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: "#EEE8DE",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    marginTop: 4,
    width: 36,
  },
  copy: {
    flex: 1,
  },
  title: {
    color: "#111827",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  subtitle: {
    color: "#6F685E",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  action: {
    alignSelf: "center",
    marginTop: 6,
  },
});
