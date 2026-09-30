"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  fullName: string;
  email: string;
  userType: "entrepreneur" | "community";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  signup: (fullName: string, email: string, password: string, userType: string) => Promise<void>;
  signin: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const signup = async (fullName: string, email: string, password: string, userType: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: fullName, 
          email, 
          password, 
          role: userType // 'user' or 'admin' based on your backend
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Signup failed");
      }

      const data = await response.json();
      setToken(data.token);
      setUser({
        fullName: data.user.name,
        email: data.user.email,
        userType: data.user.role === 'admin' ? 'entrepreneur' : 'community'
      });
      
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify({
        fullName: data.user.name,
        email: data.user.email,
        userType: data.user.role === 'admin' ? 'entrepreneur' : 'community'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const signin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Signin failed");
      }

      const data = await response.json();
      setToken(data.token);
      setUser({
        fullName: data.user.name,
        email: data.user.email,
        userType: data.user.role === 'admin' ? 'entrepreneur' : 'community'
      });
      
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify({
        fullName: data.user.name,
        email: data.user.email,
        userType: data.user.role === 'admin' ? 'entrepreneur' : 'community'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, token, signup, signin, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
