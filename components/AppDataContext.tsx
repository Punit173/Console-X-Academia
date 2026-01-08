// components/AppDataContext.tsx
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import type { ApiResponse } from "@/types/academia";
import { DEMO_DATA } from "@/data/demo-data";


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
  logout: () => void;
  isLoading: boolean;
  fetchError: boolean;
  authError: boolean;
  isInitialized: boolean;
}

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const [data, setDataState] = useState<ApiResponse | null>(null);
  const [credentials, setCredentialsState] = useState<Credentials | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Helper helper to validate data structure
  const isValidData = (d: any): d is ApiResponse => {
    return d && d.status === "success" && d.attendance && d.timetable;
  };

  // Load data and credentials from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedData = localStorage.getItem("academia-data");
      const storedCreds = localStorage.getItem("academia-creds");

      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          if (isValidData(parsed)) {
            setDataState(parsed);
          } else {
            console.warn("Invalid data found in storage, clearing...");
            localStorage.removeItem("academia-data");
          }
        } catch {
          localStorage.removeItem("academia-data");
        }
      }

      if (storedCreds) {
        try {
          const parsedCreds = JSON.parse(storedCreds);
          if (parsedCreds.email && parsedCreds.password) {
            setCredentialsState(parsedCreds);
          }
        } catch { }
      }
    }
    setIsInitialized(true);
  }, []);

  /* Force Refresh on Init */
  useEffect(() => {
    if (isInitialized && credentials && typeof window !== "undefined") {
      // We only refresh if we have credentials (meaning user logged in)
      // refreshData() handles the API call.
      refreshData();
    }
  }, [isInitialized]); // Only run once when initialized

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
    setAuthError(false); // Reset auth error on new credentials
    if (typeof window !== "undefined") {
      if (newCreds) {
        localStorage.setItem("academia-creds", JSON.stringify(newCreds));
      } else {
        localStorage.removeItem("academia-creds");
      }
    }
  };

  const refreshData = async () => {
    // If we have no credentials, we can't refresh from API.
    // If we also have no data, fallback to demo.
    if (!credentials) {
      if (!data) {
        console.warn("No credentials found, loading Demo Data");
        setData(DEMO_DATA);
      }
      return;
    }

    setIsLoading(true);
    setFetchError(false);
    setAuthError(false);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (res.ok) {
        const json = await res.json();
        // Validate structure before setting
        if (json.status === "success" && isValidData(json)) {
          setData(json);
        } else {
          console.warn("Refresh failed (Invalid Data Structure), using existing or demo data");
          setFetchError(true);
          if (!data) setData(DEMO_DATA);
        }
      } else {
        // Handle 401 specifically
        if (res.status === 401) {
          console.warn("Auth Failed: Credentials rejected by server");
          setAuthError(true);
          // We do NOT partial fallback here, we want the user to know auth failed
          // But if they have stale data, they might still see it? 
          // Better to let them keep stale data but show a persistent warning.
        } else {
          console.warn("Refresh failed (Network/Server), using existing or demo data");
          setFetchError(true);
          if (!data) setData(DEMO_DATA); // Fallback if empty
        }
      }
    } catch (error) {
      console.error("Failed to refresh data", error);
      setFetchError(true);
      if (!data) setData(DEMO_DATA); // Fallback if empty
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setData(null);
    setCredentials(null);
    setAuthError(false);
  };

  return (
    <AppDataContext.Provider value={{ data, setData, credentials, setCredentials, refreshData, isLoading, fetchError, authError, logout, isInitialized }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
};
