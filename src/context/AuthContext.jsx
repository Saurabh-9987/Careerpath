/* oxlint-disable react/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import {
  supabase,
  authConfig,
  isSupabaseConfigured,
  getAuthDiagnostics,
} from "../lib/supabase";
import { AuthConfigurationError } from "../lib/authErrors";

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  isConfigured: false,
  authConfig: null,
  diagnostics: null,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Retrieve initial session safely
    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession }, error }) => {
        if (!isMounted) return;
        if (error) {
          console.warn("[Auth] Session retrieval status:", error.message);
        }
        setSession(initialSession ?? null);
        setUser(initialSession?.user ?? null);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn("[Auth] Unexpected session check error:", err?.message || err);
        setLoading(false);
      });

    // Listen to Supabase auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!isMounted) return;
      setSession(currentSession ?? null);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (emailOrOptions, maybePassword) => {
    if (!isSupabaseConfigured) {
      throw new AuthConfigurationError(authConfig.message);
    }

    const email =
      typeof emailOrOptions === "object" ? emailOrOptions.email : emailOrOptions;
    const password =
      typeof emailOrOptions === "object" ? emailOrOptions.password : maybePassword;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  };

  const signIn = async (emailOrOptions, maybePassword) => {
    if (!isSupabaseConfigured) {
      throw new AuthConfigurationError(authConfig.message);
    }

    const email =
      typeof emailOrOptions === "object" ? emailOrOptions.email : emailOrOptions;
    const password =
      typeof emailOrOptions === "object" ? emailOrOptions.password : maybePassword;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    setSession(null);
    setUser(null);
  };

  const value = {
    user,
    session,
    loading,
    isConfigured: isSupabaseConfigured,
    authConfig,
    diagnostics: getAuthDiagnostics(),
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
