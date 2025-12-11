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
}

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const [data, setDataState] = useState<ApiResponse | null>(null);
  const [credentials, setCredentialsState] = useState<Credentials | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);

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
        console.warn("Refresh failed (Network/Server), using existing or demo data");
        setFetchError(true);
        if (!data) setData(DEMO_DATA); // Fallback if empty
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
    if (typeof window !== "undefined") {
      // Optional: force reload to plain login state
      window.location.href = "/";
    }
  };

  return (
    <AppDataContext.Provider value={{ data, setData, credentials, setCredentials, refreshData, isLoading, fetchError, logout }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
};
