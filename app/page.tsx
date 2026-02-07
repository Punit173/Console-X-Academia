// app/page.tsx
"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/components/AppDataContext";
import type { ApiResponse } from "@/types/academia";
import Image from "next/image";
import logo from "../public/assets/logo.jpg";
import { Lock, User, ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { DEMO_DATA } from "@/data/demo-data";

export default function LoginPage() {
  const router = useRouter();
  const { data, setData, setCredentials } = useAppData();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) router.push("/dashboard");
  }, [data, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const normalizedEmail = email.trim();

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      if (!res.ok) {
        console.log("Login Error Status:", res.status, res.statusText);
        let errData;
        try {
          errData = await res.json();
          console.log("Login Error Body:", errData);
        } catch (e) {
          console.log("Login Error Body (Non-JSON):", await res.text());
        }

        throw new Error((errData && (errData.details || errData.error)) || res.statusText || "Login failed");
      }

      const json = (await res.json()) as ApiResponse;

      if (json.status !== "success") throw new Error("Login failed");

      setData(json);
      setCredentials({ email: normalizedEmail, password });
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login failed", err);
      setError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (data) return null;

  return (
    <div className="flex items-center justify-center bg-[#090A0F] relative overflow-hidden">

      {/* Blob Animation */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0,0) scale(1); }
          33% { transform: translate(30px,-50px) scale(1.1); }
          66% { transform: translate(-20px,20px) scale(0.9); }
          100% { transform: translate(0,0) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-orange-600 blur-[120px] opacity-40 animate-blob hidden md:block" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-600 blur-[120px] opacity-30 animate-blob animation-delay-2000 hidden md:block" />
        <div className="absolute -bottom-32 left-20 w-96 h-96 bg-purple-600 blur-[120px] opacity-40 animate-blob animation-delay-4000 hidden md:block" />
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-5xl bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex">

        {/* LEFT PANEL — HIDDEN ON MOBILE */}
        <div className="hidden md:flex md:w-1/2 p-12 flex-col justify-between relative">
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/20">
                <Image src={logo} alt="Logo" width={48} height={48} />
              </div>
              <span className="text-xl font-bold text-white uppercase tracking-widest">
                Console <span className="text-orange-500">X</span> Academia
              </span>
            </div>

            <h1 className="text-5xl font-black text-white leading-tight mb-6">
              Academic <br />
              <span className="bg-linear-to-r from-blue-400 to-orange-500 bg-clip-text text-transparent">
                Intelligence.
              </span>
            </h1>

            <div className="space-y-4">
              <Feature text="Real-time Attendance Tracking" />
              <Feature text="Advanced Grade Analytics" />
              <Feature text="Unified Student Dashboard" />
            </div>
          </div>

          <p className="text-xs text-gray-500 uppercase tracking-widest">
            Available on Google Play
          </p>
        </div>

        {/* RIGHT PANEL — FULL WIDTH ON MOBILE */}
        <div className="w-full md:w-1/2 p-6 md:p-12 flex items-center justify-center">
          <div className="w-full max-w-sm space-y-8">

            {/* Mobile Logo */}
            <div className="md:hidden flex justify-center gap-3 items-center">
              <Image src={logo} alt="Logo" width={40} height={40} />
              <span className="text-lg font-bold text-white">
                Console<span className="text-orange-500">X</span> Academia
              </span>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
              <p className="text-gray-400 text-sm mt-2">
                Access your student dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <InputField
                label="Email"
                icon={<User className="w-5 h-5" />}
                type="text"
                value={email}
                onChange={setEmail}
                placeholder="netid@srmist.edu.in"
              />

              <InputField
                label="Password"
                icon={<Lock className="w-5 h-5" />}
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
              />

              {error && (
                <div className="text-red-400 text-xs bg-red-500/10 p-2 rounded">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl p-4 font-bold text-white bg-gradient-to-r from-blue-600 to-orange-600 hover:opacity-90 transition"
              >
                <span className="flex items-center justify-center gap-2">
                  {loading ? "Verifying..." : "Login"}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </span>
              </button>
            </form>

            <p className="text-center text-[10px] text-gray-600">
              Console v1.0
            </p>

            <div className="pt-4 border-t border-white/10 text-center">
              <a href="/calculator" className="text-sm font-bold text-orange-500 hover:text-orange-400 transition-colors flex items-center justify-center gap-2">
                <span className="bg-orange-500/10 p-2 rounded-lg">Use CGPA Calculator</span>
              </a>
              <p className="text-[10px] text-gray-500 mt-2">No login required</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-gray-400">
      <CheckCircle2 className="w-5 h-5 text-blue-500" />
      <span>{text}</span>
    </div>
  );
}

function InputField({
  label,
  icon,
  type,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  icon: React.ReactNode;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="space-y-1">
      <label className="text-xs uppercase text-gray-500 font-semibold">
        {label}
      </label>
      <div className="relative flex items-center">
        <div className="absolute left-0 text-gray-500">{icon}</div>
        <input
          type={isPassword ? (showPassword ? "text" : "password") : type}
          value={value}
          required
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent border-b border-gray-700 pl-8 pr-8 py-3 text-white focus:outline-none focus:border-orange-500"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-0 text-gray-500 hover:text-gray-300 focus:outline-none"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
