// app/page.tsx
"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/components/AppDataContext";
import type { ApiResponse } from "@/types/academia";
import Image from "next/image";
import logo from "../public/assets/logo.jpg";

export default function LoginPage() {
  const router = useRouter();
  const { data, setData, setCredentials } = useAppData();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (data) {
      router.push("/dashboard");
    }
  }, [data, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Login failed");
        return;
      }

      const json = (await res.json()) as ApiResponse;

      if (json.status !== "success") {
        setError("Invalid credentials or API error");
        return;
      }

      setData(json);
      setCredentials({ email, password });
      router.push("/dashboard");
    } catch (err: any) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (data) return null; // Prevent flashing if redirecting

  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[150px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[150px] opacity-30"></div>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left Side: Branding */}
        <div className="hidden md:flex flex-col justify-center space-y-8 p-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl shadow-2xl shadow-primary/30">
            {/* <span className="text-4xl font-bold text-white">⌘</span> */}
            <Image src={logo} className="rounded-4xl" alt="Console X Academia Logo" width={80} height={80} />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl font-black text-white tracking-tight leading-tight">
              Level Up Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">
                Academic Game
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              The ultimate dashboard for students. Track marks, attendance, and schedule in one premium interface.
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm font-medium text-gray-400">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <span>📊</span> Real-time Stats
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <span>🔒</span> Secure Access
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full max-w-md mx-auto">
          <div className="glass-card rounded-2xl p-8 sm:p-10 shadow-2xl shadow-black/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-orange-400 to-primary"></div>
            
            <div className="mb-8 text-center md:text-left">
              <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-muted-foreground text-sm">Enter your credentials to access the console.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500 group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all duration-200 text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@university.edu"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500 group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all duration-200 text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3 text-red-400 text-sm animate-slide-in">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full font-bold py-4 px-4 rounded-xl text-white transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg ${
                  loading
                    ? "bg-gray-800 cursor-not-allowed opacity-60"
                    : "bg-gradient-to-r from-primary to-orange-600 hover:shadow-primary/25 active:scale-95"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Authenticating...
                  </span>
                ) : (
                  "Initialize Session"
                )}
              </button>
            </form>
          </div>
          
          <p className="text-center text-gray-600 text-xs mt-6">
            Protected by Console Security Systems • v2.0
          </p>
        </div>
      </div>
    </div>
  );
}
