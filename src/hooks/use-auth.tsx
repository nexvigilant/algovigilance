"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { type User, onAuthStateChanged, onIdTokenChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { syncUserToFirestore } from "@/lib/sync-user";
import { DEMO_MODE, DEMO_FIREBASE_USER } from "@/lib/demo-user";

import { logger } from "@/lib/logger";
const log = logger.scope("hooks/use-auth");

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Demo mode: bypass Firebase entirely, use mock user
    if (DEMO_MODE) {
      log.info("[DEMO MODE] Using demo user — Firebase auth bypassed");
      setUser(DEMO_FIREBASE_USER as User);
      setLoading(false);
      return;
    }

    // Safety timeout: if onAuthStateChanged never fires (App Check hang,
    // reCAPTCHA blocked, network issue), resolve loading after 5 seconds
    // so the page doesn't hang indefinitely on "authenticating"
    const safetyTimeout = setTimeout(() => {
      setLoading((current) => {
        if (current) {
          log.warn(
            "[use-auth] Auth state timeout — resolving as unauthenticated",
          );
          return false;
        }
        return current;
      });
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearTimeout(safetyTimeout);
      setUser(user);
      setLoading(false);

      // Sync user data to Firestore when they sign in
      if (user) {
        try {
          await syncUserToFirestore(user);
        } catch (err) {
          // Log but don't block auth - user can still use the app
          // Sync will retry on next auth state change
          log.error("Failed to sync user to Firestore", err);
        }
      }
    });

    return () => {
      clearTimeout(safetyTimeout);
      unsubscribe();
    };
  }, []);

  // Sync ID token cookie on auth state changes
  // Always sync when user signs in (to enable redirect to protected routes)
  // Only sync token refresh on protected routes (to avoid noise on public pages)
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Demo mode: no token sync needed
    if (DEMO_MODE) return;

    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      // Abort any previous in-flight token sync request
      abortControllerRef.current?.abort();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Auto-abort after 5 seconds to prevent hanging requests
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        if (currentUser) {
          // Always sync on initial sign-in, or when on protected route
          // This ensures the cookie is set before redirecting to /nucleus
          const token = await currentUser.getIdToken();
          await fetch("/api/auth/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
            signal: controller.signal,
          });
        } else {
          // Always clear token when user signs out
          await fetch("/api/auth/token", {
            method: "DELETE",
            signal: controller.signal,
          });
        }
      } catch (error) {
        // Don't log abort errors - they are expected when a new token change fires
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        log.error("[use-auth] Failed to sync auth token to server", error);
      } finally {
        clearTimeout(timeoutId);
      }
    });

    return () => {
      unsubscribe();
      // Abort any pending request on cleanup
      abortControllerRef.current?.abort();
    };
  }, []); // No dependencies - always listen for auth changes

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({ user, loading }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
