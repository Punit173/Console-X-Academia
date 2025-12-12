// app/page.tsx
"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/components/AppDataContext";
import type { ApiResponse } from "@/types/academia";
import Image from "next/image";
import logo from "../public/assets/logo.jpg";
import { Lock, User, ArrowRight, CheckCircle2 } from "lucide-react";

import { DEMO_DATA } from "@/data/demo-data";

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

    // Normalize email: Append @srmist.edu.in if missing
    const normalizedEmail = email.trim().includes("@")
      ? email.trim()
      : `${email.trim()}@srmist.edu.in`;

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      if (!res.ok) {
        console.warn("API Error, falling back to Demo Mode");
        setData(DEMO_DATA);
        setCredentials({ email: "demo@srmist.edu.in", password: "demo" });
        router.push("/dashboard");
        return;
      }

      const json = (await res.json()) as ApiResponse;

      if (json.status !== "success") {
        console.warn("Login failed, falling back to Demo Mode");
        setData(DEMO_DATA);
        setCredentials({ email: "demo@srmist.edu.in", password: "demo" });
        router.push("/dashboard");
        return;
      }

      setData(json);
      setCredentials({ email: normalizedEmail, password });
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Network/System Error, falling back to Demo Mode");
      setData(DEMO_DATA);
      setCredentials({ email: "demo@srmist.edu.in", password: "demo" });
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (data) return null;

  return (
    <div className="min-h-screen w-full flex items-center justify-center overflow-x-hidden bg-[#090A0F] p-4 relative">
      
      {/* --- CSS for Blob Animation --- */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>

      {/* --- Smooth Gradient Background Layers --- */}
      <div className="fixed inset-0 w-full h-full bg-[#090A0F] overflow-hidden pointer-events-none">
        {/* Blob 1: Orange (Primary Focus) */}
        <div className="absolute top-0 -left-4 w-64 md:w-96 h-64 md:h-96 bg-orange-600 rounded-full mix-blend-screen filter blur-[80px] md:blur-[128px] opacity-40 animate-blob"></div>
        
        {/* Blob 2: Primary Blue (Contrast) */}
        <div className="absolute top-0 -right-4 w-64 md:w-96 h-64 md:h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-[80px] md:blur-[128px] opacity-30 animate-blob animation-delay-2000"></div>
        
        {/* Blob 3: Deep Purple (Depth) */}
        <div className="absolute -bottom-32 left-20 w-64 md:w-96 h-64 md:h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-[80px] md:blur-[128px] opacity-40 animate-blob animation-delay-4000"></div>
        
        {/* Overlay Texture */}
        <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-[0.03]"></div>
      </div>

      {/* Main Container - The "Console" */}
      <div className="relative z-10 w-full max-w-6xl">
        <div className="w-full bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col md:flex-row min-h-0 md:min-h-[600px]">
          
          {/* Left Side: Visuals & Brand */}
          <div className="w-full md:w-1/2 p-6 md:p-12 relative flex flex-col justify-between overflow-hidden order-1">
            {/* Ambient Background Glow for Left Panel */}
            <div className="absolute top-[-50%] left-[-50%] w-full h-full bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6 md:mb-8">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl overflow-hidden shadow-lg border border-white/20 flex-shrink-0">
                    <Image src={logo} alt="Logo" width={48} height={48} className="object-cover" />
                </div>
                <span className="text-lg md:text-xl font-bold tracking-widest text-white uppercase">Console <span className="text-orange-500">X</span> Academia</span>
              </div>

              <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4 md:mb-6">
                Academic <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-orange-400 to-orange-600">
                  Intelligence.
                </span>
              </h1>
              
              <div className="space-y-3 md:space-y-4 mb-8">
                <div className="flex items-center gap-3 text-sm md:text-base text-gray-400">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-blue-500 flex-shrink-0" />
                    <span>Real-time Attendance Tracking</span>
                </div>
                <div className="flex items-center gap-3 text-sm md:text-base text-gray-400">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-blue-500 flex-shrink-0" />
                    <span>Advanced Grade Analytics</span>
                </div>
                <div className="flex items-center gap-3 text-sm md:text-base text-gray-400">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-blue-500 flex-shrink-0" />
                    <span>Unified Student Dashboard</span>
                </div>
              </div>
            </div>

            {/* Platform Badges */}
            <div className="relative z-10 pt-6 md:pt-8 border-t border-white/10">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Available On</p>
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                    {/* Google Play Badge Button */}
                    <a
                        href="https://play.google.com/store/apps/details?id=com.akshat.academia"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 bg-black border border-gray-700 hover:border-gray-500 hover:bg-gray-900 rounded-lg px-4 py-2 transition-all duration-300 w-full sm:w-auto"
                    >
                         <img width="24" height="24" src="https://img.icons8.com/fluency/48/google-play.png" alt="google-play-store-new" className="flex-shrink-0"/>
                        <div className="flex flex-col text-left">
                            <span className="text-[10px] uppercase font-bold text-gray-400 leading-none">Get it on</span>
                            <span className="text-sm font-bold text-white leading-tight">Google Play</span>
                        </div>
                    </a>

                    {/* Chrome Extension Badge */}
                    <a href="#" className="group flex items-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg px-4 py-2 transition-all duration-300 w-full sm:w-auto">
                        {/* Using the original Chrome icon you provided */}
                        <img width="24" height="24" src="https://img.icons8.com/?size=100&id=ejub91zEY6Sl&format=png&color=000000" alt="chrome_icon" className="flex-shrink-0"/>
                        <div className="flex flex-col text-left">
                            <span className="text-[10px] uppercase font-bold text-gray-400 leading-none">Feedback Filler</span>
                            <span className="text-sm font-bold text-white leading-tight">Chrome Ext.</span>
                        </div>
                    </a>
                </div>
            </div>
          </div>

          {/* Right Side: Login Form */}
          <div className="w-full md:w-1/2 bg-black/40 p-6 md:p-12 flex flex-col justify-center relative border-t md:border-t-0 md:border-l border-white/5 order-2">
             {/* Subtle internal glow for the form area */}
             <div className="absolute top-10 right-10 w-32 h-32 bg-orange-500/10 blur-[60px] rounded-full pointer-events-none" />

            <div className="max-w-sm mx-auto w-full space-y-6 md:space-y-8 relative z-20">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white">Welcome Back</h2>
                <p className="text-gray-400 mt-2 text-sm">Access your student dashboard.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                
                {/* Email Input */}
                <div className="group space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">NetID / Email</label>
                  <div className="relative flex items-center">
                    <User className="absolute left-0 w-5 h-5 text-gray-500 transition-colors group-focus-within:text-blue-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="xy1234"
                      className="w-full bg-transparent border-b border-gray-700 py-3 pl-8 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all duration-300 text-sm md:text-base"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="group space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Password</label>
                    <div className="relative flex items-center">
                        <Lock className="absolute left-0 w-5 h-5 text-gray-500 transition-colors group-focus-within:text-orange-500" />
                        <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••"
                        className="w-full bg-transparent border-b border-gray-700 py-3 pl-8 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition-all duration-300 text-sm md:text-base"
                        />
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/10 border-l-2 border-red-500 p-3 text-red-400 text-xs animate-shake">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full group relative overflow-hidden rounded-xl p-3 md:p-4 font-bold text-white transition-all duration-300 ${
                    loading ? "bg-gray-800 cursor-not-allowed" : "bg-gradient-to-r from-blue-600 to-orange-600 hover:shadow-[0_0_20px_rgba(234,88,12,0.3)]"
                  }`}
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <span className="relative flex items-center justify-center gap-2 text-sm md:text-base">
                    {loading ? "Verifying..." : "Login to Console"}
                    {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                  </span>
                </button>
              </form>

              <div className="pt-4 text-center">
                <p className="text-[10px] text-gray-600">
                  By logging in, you agree to the Terms of Service. <br/>
                  Protected by Console Security v2.0
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}