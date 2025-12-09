// components/AppDataContext.tsx
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import type { ApiResponse } from "@/types/academia";

interface Credentials {
  email: string;
  password: string;
}

interface AppDataContextValue {
  data: ApiResponse | null;
  setData: (data: ApiResponse | null) => void;
  credentials: Credentials | null;
  setCredentials: (creds: Credentials | null) => void;
  refreshData: () => Promise<void>;
  isLoading: boolean;
}

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const [data, setDataState] = useState<ApiResponse | null>(null);
  const [credentials, setCredentialsState] = useState<Credentials | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load data and credentials from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedData = localStorage.getItem("academia-data");
      const storedCreds = localStorage.getItem("academia-creds");
      
      if (storedData) {
        try {
          setDataState(JSON.parse(storedData));
        } catch {}
      }
      
      if (storedCreds) {
        try {
          setCredentialsState(JSON.parse(storedCreds));
        } catch {}
      }
    }
  }, []);

  const setData = (newData: ApiResponse | null) => {
    setDataState(newData);
    if (typeof window !== "undefined") {
      if (newData) {
        localStorage.setItem("academia-data", JSON.stringify(newData));
      } else {
        localStorage.removeItem("academia-data");
      }
    }
  };

  const setCredentials = (newCreds: Credentials | null) => {
    setCredentialsState(newCreds);
    if (typeof window !== "undefined") {
      if (newCreds) {
        localStorage.setItem("academia-creds", JSON.stringify(newCreds));
      } else {
        localStorage.removeItem("academia-creds");
      }
    }
  };

  const refreshData = async () => {
    if (!credentials) return;
    
    setIsLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.status === "success") {
          setData(json);
        }
      }
    } catch (error) {
      console.error("Failed to refresh data", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppDataContext.Provider value={{ data, setData, credentials, setCredentials, refreshData, isLoading }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
};
