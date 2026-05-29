import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Navigate, useLocation } from "react-router";
import { supabase } from "@/lib/supabaseClient";
import { apiRequest } from "@/lib/apiClient";

export type UserRole = "manager" | "sales" | "client";

type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
};

type MeResponse = {
  user: {
    id: string;
    email: string;
  };
  profile: Profile;
};

type AuthContextValue = {
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  reloadUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function reloadUser() {
    setIsLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Session yoksa kullanıcı login değildir.
    if (!session) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      // Worker /api/me token'ı doğrular ve gerçek profile bilgisini döndürür.
      const me = await apiRequest<MeResponse>("/me");
      setProfile(me.profile);
    } catch {
      // Token bozuksa veya profile bulunamazsa kullanıcıyı çıkmış kabul ediyoruz.
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  useEffect(() => {
    reloadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      reloadUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        profile,
        isLoading,
        isAuthenticated: Boolean(profile),
        logout,
        reloadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700">
        Checking authentication...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export function RoleRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles: UserRole[];
}) {
  const { profile, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700">
        Checking permissions...
      </div>
    );
  }

  if (!isAuthenticated || !profile) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to="/conversations" replace />;
  }

  return children;
}