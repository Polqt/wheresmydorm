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
import { saveSessionForRestore } from "@/services/auth";
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
const SPLASH_MS = 6200;
const LOADING_TIMEOUT_MS = 10_000;

// Once the splash plays once per app launch, skip the GIF on subsequent loads.
let hasShownInitialSplash = false;

const SETUP_SCREENS = new Set([
  "role-select",
  "profile-setup",
  "avatar-setup",
  "contact-info",
  "permissions",
]);

function AuthGate({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const segments = useSegments();
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
    queryKey: ["auth-profile", session?.user.id],
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
  });

  // Splash timer — skip GIF if it already played this app session
  useEffect(() => {
    if (hasShownInitialSplash) {
      setSplashDone(true);
      return;
    }
    const id = setTimeout(() => {
      hasShownInitialSplash = true;
      setSplashDone(true);
    }, SPLASH_MS);
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
        queryClient.invalidateQueries({ queryKey: ["auth-profile"] });
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const role = profileQuery.data?.role ?? null;
  const isReady =
    isSessionReady && (!session || (!profileQuery.isLoading && !profileQuery.error));
  const isInAuth = firstSegment === "auth";
  const isIndexRoute = firstSegment === undefined;
  const isOnboardingRoute = firstSegment === "onboarding";
  const isSetupRoute = isInAuth && SETUP_SCREENS.has(secondSegment ?? "");

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
    if (!isReady || !splashDone) return;

    let cancelled = false;

    const sync = async () => {
      let onboardingDone = false;
      try {
        onboardingDone = await getOnboardingCompletion(session?.user.id);
      } catch {
        // treat as not done
      }

      if (cancelled) return;

      // --- Not signed in ---
      if (!session) {
        if (!onboardingDone && !isOnboardingRoute) {
          startTransition(() => router.replace("/onboarding"));
        } else if (onboardingDone && !isInAuth) {
          startTransition(() => router.replace("/auth/sign-in"));
        }
        return;
      }

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

      // --- Signed in, has role, check onboarding ---
      if (!onboardingDone && !isOnboardingRoute) {
        startTransition(() => router.replace("/onboarding"));
        return;
      }

      if ((isInAuth || isIndexRoute || isOnboardingRoute) && onboardingDone) {
        startTransition(() => router.replace("/(tabs)/map"));
      }
    };

    void sync();
    return () => { cancelled = true; };
  }, [
    clearAwaitingRoleSync,
    isAwaitingRoleSync,
    isInAuth,
    isIndexRoute,
    isOnboardingRoute,
    isReady,
    isSetupRoute,
    role,
    secondSegment,
    session,
    splashDone,
  ]);

  const handleRetry = useCallback(() => {
    setLoadingTooLong(false);
    queryClient.invalidateQueries({ queryKey: ["auth-profile"] });
  }, [queryClient]);

  const signOut = useCallback(async () => {
    clearAwaitingRoleSync();
    clearPendingEmail();
    // Save the refresh token before clearing the session so tryRestoreSession()
    // can restore it on quick re-login, avoiding Supabase's email OTP rate limit.
    await saveSessionForRestore();
    await supabase.auth.signOut({ scope: "local" });
    queryClient.removeQueries({ queryKey: ["auth-profile"] });
    startTransition(() => router.replace("/auth/sign-in"));
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
      return <AppLaunchScreen body="" title="" showGif />;
    }

    return (
      <AppLaunchScreen
        showGif={false}
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
