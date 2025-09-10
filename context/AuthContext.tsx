"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";
import { useRouter, usePathname } from "next/navigation";


type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      const isAuthPage = pathname.startsWith("/auth");

      if (!firebaseUser) {
        // 🚫 Not logged in
        if (!isAuthPage) {
          router.replace("/auth/login");
        }
        return;
      }

      const isEmailPassword = firebaseUser.providerData[0]?.providerId === "password";
      const isEmailVerified = firebaseUser.emailVerified;

      if (isEmailPassword && !isEmailVerified) {
        // 📩 Needs verification
        if (!isAuthPage) {
          router.replace("/auth/verify");
        }
        return;
      }

      // ✅ Logged in and verified, but on an auth page
      if (isAuthPage) {
  router.replace("/main"); // ← changed from '/'
}
    });

    return () => unsubscribe();
  }, [router, pathname]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

