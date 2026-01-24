"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Code, Trophy, Target, Award, Disc } from "lucide-react";
import { motion } from "framer-motion";

export default function LeetCodePage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load username from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem("leetcode_username");
        if (saved) {
            setUsername(saved);
            setSearchQuery(saved);
            fetchStats(saved);
        }
    }, []);

    const fetchStats = async (user: string) => {
        if (!user.trim()) return;
        setLoading(true);
        setError(null);
        setData(null);

        try {
            const res = await fetch(`/api/leetcode?username=${user}`);
            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || "Failed to fetch data");
            }

            setData(json);
            localStorage.setItem("leetcode_username", user);
            setUsername(user);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchStats(searchQuery);
    };

    // Helper to get stats safely
    const getStat = (difficulty: string) => {
        if (!data) return { count: 0, total: 0 };

        const solved = data.matchedUser.submitStats.acSubmissionNum.find(
            (s: any) => s.difficulty === difficulty
        )?.count || 0;

        const total = data.allQuestionsCount.find(
            (s: any) => s.difficulty === difficulty
        )?.count || 0;

        return { count: solved, total };
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-orange-500/30 pb-20">

            {/* Background Glow */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-orange-600/10 blur-[150px]" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10 mb-8">
                    <div>
                        <button
                            onClick={() => router.back()}
                            className="mb-6 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                        </button>
                        <h1 className="text-4xl font-black text-white tracking-tight mb-2 flex items-center gap-4">
                            <Code className="w-10 h-10 text-[#FFA116]" />
                            LeetCode Stats
                        </h1>
                        <p className="text-gray-400">
                            Track your competitive programming progress.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="w-full md:w-auto relative">
                        <input
                            type="text"
                            placeholder="Enter username..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full md:w-80 bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#FFA116]/50 transition-all font-mono"
                        />
                        {loading && (
                            <div className="absolute right-3 top-3.5">
                                <div className="w-5 h-5 border-2 border-[#FFA116] border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </form>
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                        <span className="font-bold">Error:</span> {error}
                    </div>
                )}

                {!data && !loading && !error && (
                    <div className="text-center py-32 rounded-3xl border border-dashed border-white/10">
                        <Code className="w-16 h-16 text-white/10 mx-auto mb-4" />
                        <p className="text-white/40">Enter your LeetCode username to see stats.</p>
                    </div>
                )}

                {data && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Main Stats Card */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                            {/* Profile Card */}
                            <div className="md:col-span-1 bg-zinc-950 rounded-2xl border border-zinc-900 p-6 flex flex-col justify-between relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFA116]/10 blur-3xl rounded-full -mr-10 -mt-10" />

                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${data.matchedUser.username}&background=FFA116&color=000&bold=true`}
                                            alt="Avatar"
                                            className="w-12 h-12 rounded-xl"
                                        />
                                        <div>
                                            <h2 className="text-xl font-bold">{data.matchedUser.profile?.realName || data.matchedUser.username}</h2>
                                            <p className="text-xs font-mono text-gray-500">@{data.matchedUser.username}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="bg-zinc-900/50 rounded-xl p-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Trophy className="w-4 h-4 text-[#FFA116]" />
                                                <span className="text-xs uppercase font-bold text-gray-500">Global Rank</span>
                                            </div>
                                            <p className="text-2xl font-black text-white">
                                                {data.matchedUser.profile?.ranking?.toLocaleString() || "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Total Solved Card */}
                            <div className="md:col-span-2 bg-[#FFA116] rounded-2xl p-8 text-black flex items-center justify-between relative overflow-hidden group">
                                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div>
                                    <p className="text-black/60 font-bold uppercase tracking-wider mb-1">Total Solved</p>
                                    <p className="text-6xl font-black mb-2">
                                        {getStat("All").count}
                                        <span className="text-xl font-medium text-black/40 ml-2">/ {getStat("All").total}</span>
                                    </p>
                                    <div className="flex items-center gap-2 text-sm font-bold bg-black/10 px-3 py-1.5 rounded-lg w-fit">
                                        <Target className="w-4 h-4" />
                                        <span>Top 10% probably? Keep going!</span>
                                    </div>
                                </div>

                                <div className="hidden sm:block">
                                    <Target className="w-40 h-40 text-black/10 rotate-12" />
                                </div>
                            </div>

                        </div>

                        {/* Difficulty Breakdown */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            {[
                                { label: "Easy", color: "text-[#00B8A3]", bg: "bg-[#00B8A3]", stat: getStat("Easy") },
                                { label: "Medium", color: "text-[#FFC01E]", bg: "bg-[#FFC01E]", stat: getStat("Medium") },
                                { label: "Hard", color: "text-[#FF375F]", bg: "bg-[#FF375F]", stat: getStat("Hard") },
                            ].map((item) => (
                                <div key={item.label} className="bg-zinc-950 rounded-2xl border border-zinc-900 p-6 flex flex-col items-center justify-center text-center hover:border-white/10 transition-colors">
                                    <p className={`text-sm font-bold uppercase tracking-wider mb-4 ${item.color}`}>
                                        {item.label}
                                    </p>

                                    <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle
                                                cx="64"
                                                cy="64"
                                                r="56"
                                                stroke="currentColor"
                                                strokeWidth="8"
                                                fill="transparent"
                                                className="text-zinc-900"
                                            />
                                            <circle
                                                cx="64"
                                                cy="64"
                                                r="56"
                                                stroke="currentColor"
                                                strokeWidth="8"
                                                fill="transparent"
                                                strokeDasharray={351.86} // 2 * pi * 56
                                                strokeDashoffset={351.86 - (351.86 * item.stat.count) / (item.stat.total || 1)}
                                                className={item.color}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-3xl font-black text-white">{item.stat.count}</span>
                                            <span className="text-xs text-gray-500 font-mono">/ {item.stat.total}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                )}

            </div>
        </div>
    );
}
