"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface AuthContextValue {
  user: SupabaseUser | null;
  displayName: string | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const fetchDisplayName = useCallback(
    async (userId: string) => {
      const { data } = await supabase
        .from("users")
        .select("display_name")
        .eq("id", userId)
        .single();
      setDisplayName(data?.display_name ?? null);
    },
    [supabase]
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) fetchDisplayName(user.id);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchDisplayName(session.user.id);
      else setDisplayName(null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchDisplayName]);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchDisplayName(user.id);
  }, [user, fetchDisplayName]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setDisplayName(null);
    router.push("/login");
  }, [supabase, router]);

  return (
    <AuthContext.Provider
      value={{ user, displayName, isLoading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
