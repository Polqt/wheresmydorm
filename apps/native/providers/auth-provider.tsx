import type { Session, User } from "@supabase/supabase-js";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";
import { supabase } from "@/utils/supabase";
import { trpc } from "@/utils/trpc";

const ONBOARDING_COMPLETE_KEY = "onboarding_complete";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  role: "finder" | "lister" | "admin" | null;
  isReady: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function AuthGate({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const segments = useSegments();
  const [firstSegment, secondSegment] = segments as string[];
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;
  const [session, setSession] = useState<Session | null>(null);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [isProfileSynced, setIsProfileSynced] = useState(false);

  const syncProfile = useMutation(
    trpc.profiles.sync.mutationOptions({
      onSuccess: () => {
        setIsProfileSynced(true);
        queryClient.invalidateQueries();
      },
    }),
  );

  const profileQuery = useQuery(
    trpc.profiles.me.queryOptions(undefined, {
      enabled: Boolean(session) && isProfileSynced,
      retry: false,
    }),
  );

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setSession(data.session);
      setIsProfileSynced(!data.session);
      setIsSessionReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsProfileSynced(!nextSession);
      queryClient.invalidateQueries();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  useEffect(() => {
    if (!session || isProfileSynced || syncProfile.isPending) {
      return;
    }

    startTransition(() => {
      syncProfile.mutate(undefined, {
        onError: () => {
          setIsProfileSynced(true);
        },
      });
    });
  }, [isProfileSynced, session, syncProfile]);

  const role = profileQuery.data?.role ?? null;
  const isReady =
    isSessionReady &&
    (!session ||
      (isProfileSynced && !profileQuery.isLoading && !syncProfile.isPending));
  const isInAuth = firstSegment === "auth";
  const isIndexRoute = firstSegment === undefined;
  const isOnboardingRoute = firstSegment === "onboarding";
  const isRoleSelectRoute = isInAuth && secondSegment === "role-select";
  const isSignInRoute = isInAuth && secondSegment === "sign-in";

  useEffect(() => {
    let isCancelled = false;

    if (!isReady) {
      return () => {
        isCancelled = true;
      };
    }

    const syncRoute = async () => {
      if (!session) {
        if ((!isInAuth && !isIndexRoute) || isRoleSelectRoute) {
          router.replace("/auth/sign-in");
        }
        return;
      }

      if (!role) {
        if (!isRoleSelectRoute && !isSignInRoute) {
          router.replace("/auth/role-select");
        }
        return;
      }

      if (role && !isInAuth && !isOnboardingRoute) {
        const onboardingDone = await SecureStore.getItemAsync(
          ONBOARDING_COMPLETE_KEY,
        );

        if (isCancelled) {
          return;
        }

        if (!onboardingDone) {
          router.replace("/onboarding");
          return;
        }
      }

      if (isInAuth || isIndexRoute) {
        router.replace("/(tabs)/map");
      }
    };

    void syncRoute();

    return () => {
      isCancelled = true;
    };
  }, [
    isInAuth,
    isIndexRoute,
    isReady,
    isOnboardingRoute,
    isRoleSelectRoute,
    isSignInRoute,
    role,
    session,
  ]);

  const handleRetryProfile = useCallback(() => {
    void profileQuery.refetch();
  }, [profileQuery.refetch]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.replace("/auth/sign-in");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      role,
      isReady,
      signOut,
    }),
    [isReady, role, session, signOut],
  );

  if (!isReady) {
    return (
      <View style={[styles.stateScreen, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} size="large" />
        <Text style={[styles.stateTitle, { color: theme.text }]}>
          Preparing your account
        </Text>
        <Text style={[styles.stateBody, { color: theme.text }]}>
          We're checking your session and loading your role.
        </Text>
      </View>
    );
  }

  if (session && profileQuery.error) {
    return (
      <View style={[styles.stateScreen, { backgroundColor: theme.background }]}>
        <Text style={[styles.stateTitle, { color: theme.text }]}>
          We couldn't load your profile
        </Text>
        <Text style={[styles.stateBody, { color: theme.text }]}>
          Please try again or sign out and reconnect your account.
        </Text>
        <View style={styles.actions}>
          <Pressable
            onPress={handleRetryProfile}
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.primaryButtonText}>Retry</Text>
          </Pressable>
          <Pressable
            onPress={signOut}
            style={[styles.secondaryButton, { borderColor: theme.border }]}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
              Sign out
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

const styles = StyleSheet.create({
  stateScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  stateTitle: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  stateBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.78,
    textAlign: "center",
  },
  actions: {
    marginTop: 20,
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
