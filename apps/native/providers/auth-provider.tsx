import type { Session, User } from "@supabase/supabase-js";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useSegments } from "expo-router";
import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AppLaunchScreen,
  LaunchScreenButton,
} from "@/components/ui/app-launch-screen";
import { getOnboardingCompletion } from "@/services/onboarding";
import { useAuthFlowStore } from "@/stores/auth";
import { supabase } from "@/utils/supabase";
import { trpc } from "@/utils/trpc";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  role: "finder" | "lister" | "admin" | null;
  isReady: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const MAX_PROFILE_SYNC_RETRIES = 3;
const PROFILE_SYNC_RETRY_DELAY_MS = 800;
const PROFILE_SYNC_INITIAL_DELAY_MS = 200;
const LOADING_TIMEOUT_MS = 10_000;

function AuthGate({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const segments = useSegments();
  const [firstSegment, secondSegment] = segments as string[];
  const [session, setSession] = useState<Session | null>(null);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [isProfileSynced, setIsProfileSynced] = useState(false);
  const [didRetryMissingProfileSync, setDidRetryMissingProfileSync] =
    useState(false);
  const [profileSyncFailures, setProfileSyncFailures] = useState(0);
  const [loadingTooLong, setLoadingTooLong] = useState(false);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearAwaitingRoleSync = useAuthFlowStore(
    (state) => state.clearAwaitingRoleSync,
  );
  const isAwaitingRoleSync = useAuthFlowStore(
    (state) => state.isAwaitingRoleSync,
  );

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
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
    }),
  );

  useEffect(() => {
    setDidRetryMissingProfileSync(false);
    setProfileSyncFailures(0);
  }, [session?.user.id]);

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

    if (profileSyncFailures >= MAX_PROFILE_SYNC_RETRIES) {
      setIsProfileSynced(true);
      return;
    }

    const delay =
      profileSyncFailures === 0
        ? PROFILE_SYNC_INITIAL_DELAY_MS
        : PROFILE_SYNC_RETRY_DELAY_MS * Math.pow(1.5, profileSyncFailures - 1);

    const timeoutId = setTimeout(() => {
      startTransition(() => {
        syncProfile.mutate(undefined, {
          onError: () => {
            setProfileSyncFailures((current) => current + 1);
          },
        });
      });
    }, delay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isProfileSynced, profileSyncFailures, session, syncProfile]);

  useEffect(() => {
    if (
      !session ||
      !profileQuery.error ||
      syncProfile.isPending ||
      didRetryMissingProfileSync
    ) {
      return;
    }

    if (
      !profileQuery.error.message.toLowerCase().includes("profile not found")
    ) {
      return;
    }

    setDidRetryMissingProfileSync(true);
    setProfileSyncFailures(0);
    setIsProfileSynced(false);
  }, [
    didRetryMissingProfileSync,
    profileQuery.error,
    session,
    syncProfile.isPending,
  ]);

  const role = profileQuery.data?.role ?? null;
  const isReady =
    isSessionReady &&
    (!session ||
      (isProfileSynced && !profileQuery.isLoading && !syncProfile.isPending));
  const isInAuth = firstSegment === "auth";
  const isIndexRoute = firstSegment === undefined;
  const isOnboardingRoute = firstSegment === "onboarding";
  const isRoleSelectRoute = isInAuth && secondSegment === "role-select";

  // Loading timeout: if isReady hasn't become true within LOADING_TIMEOUT_MS, show escape hatch
  useEffect(() => {
    if (isReady) {
      setLoadingTooLong(false);
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      return;
    }

    if (!isSessionReady) {
      return;
    }

    loadingTimerRef.current = setTimeout(() => {
      setLoadingTooLong(true);
    }, LOADING_TIMEOUT_MS);

    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    };
  }, [isReady, isSessionReady]);

  useEffect(() => {
    let isCancelled = false;

    if (!isReady) {
      return () => {
        isCancelled = true;
      };
    }

    const syncRoute = async () => {
      let onboardingDone = false;

      try {
        onboardingDone = await getOnboardingCompletion();
      } catch {
        onboardingDone = false;
      }

      if (isCancelled) {
        return;
      }

      if (!session) {
        if (!onboardingDone) {
          if (!isOnboardingRoute) {
            startTransition(() => router.replace("/onboarding"));
          }
          return;
        }

        if (
          isIndexRoute ||
          isOnboardingRoute ||
          (!isInAuth && !isIndexRoute) ||
          isRoleSelectRoute
        ) {
          startTransition(() => router.replace("/auth/sign-in"));
        }
        return;
      }

      if (!role) {
        if (isAwaitingRoleSync) {
          return;
        }

        if (!isRoleSelectRoute) {
          startTransition(() => router.replace("/auth/role-select"));
        }
        return;
      }

      if (isAwaitingRoleSync) {
        clearAwaitingRoleSync();
      }

      if (!onboardingDone && !isOnboardingRoute) {
        startTransition(() => router.replace("/onboarding"));
        return;
      }

      if ((isInAuth || isIndexRoute || isOnboardingRoute) && onboardingDone) {
        startTransition(() => router.replace("/(tabs)/map"));
      }
    };

    void syncRoute();

    return () => {
      isCancelled = true;
    };
  }, [
    isInAuth,
    isAwaitingRoleSync,
    isIndexRoute,
    isReady,
    isOnboardingRoute,
    isRoleSelectRoute,
    clearAwaitingRoleSync,
    role,
    session,
  ]);

  const handleRetryProfile = useCallback(() => {
    setLoadingTooLong(false);
    setDidRetryMissingProfileSync(false);
    setProfileSyncFailures(0);
    setIsProfileSynced(false);
    queryClient.invalidateQueries();
  }, [queryClient]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    startTransition(() => router.replace("/auth/sign-in"));
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
      <AppLaunchScreen
        body={
          loadingTooLong
            ? "We're having trouble connecting. You can retry or sign out and try again."
            : "We're checking your session and loading your role."
        }
        title={loadingTooLong ? "Taking longer than expected" : "Preparing your account"}
        actions={
          loadingTooLong ? (
            <>
              <LaunchScreenButton label="Retry" onPress={handleRetryProfile} />
              <LaunchScreenButton
                label="Sign out"
                onPress={signOut}
                variant="ghost"
              />
            </>
          ) : undefined
        }
      />
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
