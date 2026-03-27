import type { Session, User } from "@supabase/supabase-js";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useRootNavigationState, useSegments } from "expo-router";
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
} from "@/components/ui/launch-screen";
import { PROFILE_QUERY_KEY } from "@/lib/auth";
import { saveSessionForRestore } from "@/services/auth";
import { getOrCreateCurrentProfile } from "@/services/profile";
import { useAuthFlowStore } from "@/stores/auth";
import { finderHomeRoute, listerHomeRoute, roleHomeRoute } from "@/utils/routes";
import { supabase } from "@/utils/supabase";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  role: "finder" | "lister" | "admin" | null;
  isReady: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const SPLASH_FALLBACK_MS = 20_000;
const LOADING_TIMEOUT_MS = 10_000;

let hasShownInitialSplash = false;

const SETUP_SCREENS = new Set([
  "role-select",
  "profile-setup",
  "avatar-setup",
  "contact-info",
  "role-preferences",
  "permissions",
]);
const FINDER_TAB_GROUP = "(finder-tabs)";
const LISTER_TAB_GROUP = "(lister-tabs)";

function AuthGate({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const [firstSegment, secondSegment] = segments as string[];

  const [session, setSession] = useState<Session | null>(null);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [loadingTooLong, setLoadingTooLong] = useState(false);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAwaitingRoleSync = useAuthFlowStore((s) => s.isAwaitingRoleSync);
  const clearAwaitingRoleSync = useAuthFlowStore((s) => s.clearAwaitingRoleSync);
  const clearPendingEmail = useAuthFlowStore((s) => s.clearPendingEmail);

  const profileQuery = useQuery({
    enabled: Boolean(session),
    queryFn: () => getOrCreateCurrentProfile(session!.user),
    queryKey: [PROFILE_QUERY_KEY, session?.user.id],
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
  });

  useEffect(() => {
    if (hasShownInitialSplash) {
      setSplashDone(true);
      return;
    }
    const id = setTimeout(() => {
      hasShownInitialSplash = true;
      setSplashDone(true);
    }, SPLASH_FALLBACK_MS);
    return () => clearTimeout(id);
  }, []);

  // Session listener
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setIsSessionReady(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        queryClient.invalidateQueries({ queryKey: [PROFILE_QUERY_KEY] });
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const role = profileQuery.data?.role ?? null;
  const canNavigate = Boolean(navigationState?.key);
  const isReady =
    isSessionReady && (!session || (!profileQuery.isLoading && !profileQuery.error));
  const isInAuth = firstSegment === "auth";
  const isIndexRoute = firstSegment === undefined;
  const isSetupRoute = isInAuth && SETUP_SCREENS.has(secondSegment ?? "");
  const isInFinderTabs = firstSegment === FINDER_TAB_GROUP;
  const isInListerTabs = firstSegment === LISTER_TAB_GROUP;

  // Loading timeout
  useEffect(() => {
    if (isReady) {
      setLoadingTooLong(false);
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
      return;
    }

    if (!isSessionReady || loadingTooLong) return;

    loadingTimerRef.current = setTimeout(
      () => setLoadingTooLong(true),
      LOADING_TIMEOUT_MS,
    );

    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    };
  }, [isReady, isSessionReady, loadingTooLong]);

  // Route sync
  useEffect(() => {
    if (!isReady || !splashDone || !canNavigate) return;

    let cancelled = false;

    const sync = async () => {
      // --- Not signed in ---
      if (!session) {
        if (!isInAuth) {
          startTransition(() => router.replace("/auth/sign-in"));
        }
        return;
      }

      if (cancelled) return;

      // --- Signed in, no role yet ---
      if (!role) {
        if (isAwaitingRoleSync) return;
        if (secondSegment !== "role-select") {
          startTransition(() => router.replace("/auth/role-select"));
        }
        return;
      }

      if (isAwaitingRoleSync) clearAwaitingRoleSync();

      // Let users finish the setup flow without interruption
      if (isSetupRoute) return;

      if (role === "finder" && isInListerTabs) {
        startTransition(() => router.replace(finderHomeRoute()));
        return;
      }

      if (role === "lister" && isInFinderTabs) {
        startTransition(() => router.replace(listerHomeRoute()));
        return;
      }

      if (isInAuth || isIndexRoute || firstSegment === "onboarding") {
        startTransition(() => router.replace(roleHomeRoute(role)));
      }
    };

    void sync();
    return () => { cancelled = true; };
  }, [
    clearAwaitingRoleSync,
    isAwaitingRoleSync,
    isInAuth,
    isIndexRoute,
    isReady,
    isInFinderTabs,
    isInListerTabs,
    isSetupRoute,
    firstSegment,
    role,
    secondSegment,
    session,
    splashDone,
    canNavigate,
  ]);

  const handleRetry = useCallback(() => {
    setLoadingTooLong(false);
    queryClient.invalidateQueries({ queryKey: [PROFILE_QUERY_KEY] });
  }, [queryClient]);

  const signOut = useCallback(async () => {
    clearAwaitingRoleSync();
    clearPendingEmail();
    // Save the refresh token before clearing the session so tryRestoreSession()
    // can restore it on quick re-login, avoiding Supabase's email OTP rate limit.
    await saveSessionForRestore();
    await supabase.auth.signOut({ scope: "local" });
    setSession(null);
    queryClient.removeQueries({ queryKey: [PROFILE_QUERY_KEY] });
  }, [clearAwaitingRoleSync, clearPendingEmail, queryClient]);

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

  // --- Loading / splash screens ---
  if (!isReady || !splashDone) {
    if (!splashDone) {
      return <AppLaunchScreen body="" title="" />;
    }

    return (
      <AppLaunchScreen
        body={
          loadingTooLong
            ? "Having trouble loading your profile. You can retry or sign out."
            : "Checking your session..."
        }
        title={loadingTooLong ? "Taking longer than expected" : "Preparing your account"}
        actions={
          loadingTooLong ? (
            <>
              <LaunchScreenButton label="Retry" onPress={handleRetry} />
              <LaunchScreenButton label="Sign out" onPress={signOut} variant="ghost" />
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
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
