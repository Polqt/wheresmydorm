import type { Session, User } from "@supabase/supabase-js";

import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { getOrCreateCurrentProfile } from "@/services/profile";
import { useAuthFlowStore } from "@/stores/auth";
import { supabase } from "@/utils/supabase";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  role: "finder" | "lister" | "admin" | null;
  isReady: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const LOADING_TIMEOUT_MS = 10_000;

function AuthGate({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const segments = useSegments();
  const [firstSegment, secondSegment] = segments as string[];
  const [session, setSession] = useState<Session | null>(null);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [loadingTooLong, setLoadingTooLong] = useState(false);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearAwaitingRoleSync = useAuthFlowStore(
    (state) => state.clearAwaitingRoleSync,
  );
  const isAwaitingRoleSync = useAuthFlowStore(
    (state) => state.isAwaitingRoleSync,
  );

  const profileQuery = useQuery({
    enabled: Boolean(session),
    queryFn: () => getOrCreateCurrentProfile(session!.user),
    queryKey: ["auth-profile", session?.user.id],
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
  });

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setSession(data.session);
      setIsSessionReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      // TOKEN_REFRESHED just updates the token, no need to re-sync the profile.
      // Only a real sign-in or sign-out should reset the sync state.
      if (event === "TOKEN_REFRESHED") {
        setSession(nextSession);
        return;
      }
      setSession(nextSession);
      queryClient.invalidateQueries({ queryKey: ["auth-profile"] });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const role = profileQuery.data?.role ?? null;
  const isReady =
    isSessionReady && (!session || (!profileQuery.isLoading && !profileQuery.error));
  const isInAuth = firstSegment === "auth";
  const isIndexRoute = firstSegment === undefined;
  const isOnboardingRoute = firstSegment === "onboarding";
  const isRoleSelectRoute = isInAuth && secondSegment === "role-select";

  // Loading timeout: if isReady hasn't become true within LOADING_TIMEOUT_MS, show escape hatch.
  // loadingTooLong is included in deps so the timer restarts when the user clicks "Retry"
  // (which resets loadingTooLong to false, re-running this effect and starting a fresh timer).
  useEffect(() => {
    if (isReady) {
      setLoadingTooLong(false);
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      return;
    }

    if (!isSessionReady || loadingTooLong) {
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
  }, [isReady, isSessionReady, loadingTooLong]);

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
    queryClient.invalidateQueries({ queryKey: ["auth-profile"] });
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
            ? "We're having trouble loading your profile from Supabase. You can retry or sign out and try again."
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
