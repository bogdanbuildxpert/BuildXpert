"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is stored in localStorage as a fallback
    const storedUser = localStorage.getItem("user");
    if (storedUser && !session) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
        localStorage.removeItem("user");
      }
    }

    // If we have a session from NextAuth, use that
    if (session && session.user) {
      const nextAuthUser = {
        id: session.user.id as string,
        name: session.user.name || null,
        email: session.user.email as string,
        role: (session.user as any).role || "CLIENT",
      };
      setUser(nextAuthUser);

      // Also update localStorage for backward compatibility
      localStorage.setItem("user", JSON.stringify(nextAuthUser));
    }

    setIsLoading(status === "loading");
  }, [session, status]);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));

    // Also set the user in a cookie for server-side access
    document.cookie = `user=${JSON.stringify(userData)}; path=/; max-age=${
      60 * 60 * 24 * 7
    }`; // 7 days
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");

    // Also clear the user cookie
    document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    // Sign out from NextAuth
    signOut({ redirect: false });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
