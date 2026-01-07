"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Chrome, Star, Zap, Shield, MousePointerClick } from "lucide-react";
import extensionPreview from "../../public/assets/extension-preview.png";

export default function FeedbackFillerPage() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-[#62D834] selection:text-black pb-20 animate-fade-in">

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                        Back to Dashboard
                    </Link>
                    <div className="hidden sm:flex items-center gap-2">
                        <span className="text-sm font-bold bg-gradient-to-r from-[#62D834] to-emerald-400 bg-clip-text text-transparent">
                            CONSOLE X ACADEMIA
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/60 uppercase tracking-wider font-bold">
                            Extension
                        </span>
                    </div>
                </div>
            </nav>

            <main className="pt-24 max-w-5xl mx-auto px-4 sm:px-6">

                {/* Hero Section */}
                <div className="flex flex-col md:flex-row items-center gap-12 mb-20">
                    <div className="flex-1 space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#62D834]/10 text-[#62D834] text-xs font-bold uppercase tracking-wider border border-[#62D834]/20">
                            <Star className="w-3 h-3 fill-current" />
                            New Tool
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                            Skip the <span className="underline decoration-[#62D834] decoration-4 underline-offset-4">Feedback</span>  <br />
                            In Seconds.
                        </h1>

                        <p className="text-lg text-white/60 max-w-lg leading-relaxed">
                            Academia feedback forms are repetitive, slow, and frustrating.
                            Our Chrome Extension automates the entire process with one click.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 pt-2">
                            <a
                                href="https://chromewebstore.google.com/detail/iehppeblndjdnnoofdojmdlllcbihode?utm_source=item-share-cb"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-8 py-4 rounded-xl bg-[#62D834] text-black font-bold text-lg hover:bg-[#52c824] hover:shadow-lg hover:shadow-green-500/20 transition-all flex items-center justify-center gap-3 transform hover:-translate-y-1"
                            >
                                <Chrome className="w-6 h-6" />
                                Add to Chrome
                            </a>
                            <Link
                                href="#how-it-works"
                                className="px-8 py-4 rounded-xl bg-white/5 text-white font-bold text-lg hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center"
                            >
                                How it works
                            </Link>
                        </div>

                        <p className="text-xs text-white/40 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Safe & Secure • Runs locally • No data collection
                        </p>
                    </div>

                    <div className="flex-1 relative group w-full max-w-lg">
                        <div className="absolute inset-0 bg-[#62D834]/20 blur-[100px] rounded-full pointer-events-none group-hover:bg-[#62D834]/30 transition-all duration-700" />
                        <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
                            <Image
                                src={extensionPreview}
                                alt="Extension Preview"
                                width={800}
                                height={600}
                                className="w-full h-auto"
                                placeholder="blur"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-50" />
                        </div>
                    </div>
                </div>

                {/* Problem vs Solution */}
                <div className="grid md:grid-cols-2 gap-8 mb-20">
                    <div className="bg-red-500/5 border border-red-500/10 rounded-3xl p-8 space-y-4">
                        <h3 className="text-xl font-bold text-red-400 flex items-center gap-2">
                            <span className="p-2 rounded-lg bg-red-500/10"><Zap className="w-5 h-5 text-red-500" /></span>
                            The Problem
                        </h3>
                        <ul className="space-y-3">
                            {[
                                "Same 5 options repeated 15 times per subject",
                                "120+ manual clicks for all subjects",
                                "Slow loading pages & lost progress",
                                "Page refresh resets everything"
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-white/70">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-green-500/5 border border-green-500/10 rounded-3xl p-8 space-y-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-32 bg-[#62D834]/5 blur-3xl rounded-full" />
                        <h3 className="text-xl font-bold text-green-400 flex items-center gap-2 relative z-10">
                            <span className="p-2 rounded-lg bg-green-500/10"><CheckCircle2 className="w-5 h-5 text-green-500" /></span>
                            The Solution
                        </h3>
                        <ul className="space-y-3 relative z-10">
                            {[
                                "One click fills ALL feedback fields",
                                "Consistently applies your chosen rating",
                                "Zero manual scrolling or selecting",
                                "Finish entire feedback in seconds"
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-white/70">
                                    <CheckCircle2 className="w-5 h-5 text-[#62D834] flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* How it Works */}
                <div id="how-it-works" className="max-w-4xl mx-auto py-10">
                    <h2 className="text-3xl font-bold text-center mb-12">How to Use</h2>

                    <div className="grid gap-8 relative">
                        <div className="absolute left-[27px] top-8 bottom-8 w-0.5 bg-white/10 hidden md:block" />

                        {[
                            {
                                title: "Install & Refresh",
                                desc: "Add extension to Chrome and REFRESH the Academia page once.",
                                icon: <Chrome className="w-6 h-6" />
                            },
                            {
                                title: "Log In",
                                desc: "Log in to the Academia Student Portal and go to Course Feedback.",
                                icon: <ArrowLeft className="w-6 h-6 rotate-180" />
                            },
                            {
                                title: "Open Form",
                                desc: "Open any Course Feedback form.",
                                icon: <MousePointerClick className="w-6 h-6" />
                            },
                            {
                                title: "Auto Fill",
                                desc: "Click the '✨ Auto Fill' button at bottom-right and select rating.",
                                icon: <Zap className="w-6 h-6 text-[#62D834]" />
                            },
                        ].map((step, i) => (
                            <div key={i} className="flex gap-6 items-start">
                                <div className="relative z-10 w-14 h-14 rounded-2xl bg-[#62D834] text-black font-bold text-xl flex items-center justify-center shadow-[0_0_20px_rgba(98,216,52,0.3)] shrink-0">
                                    {i + 1}
                                </div>
                                <div className="pt-2">
                                    <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                                        {step.title}
                                    </h3>
                                    <p className="text-white/60 leading-relaxed text-lg">
                                        {step.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Final CTA */}
                <div className="mt-20 text-center bg-zinc-900 rounded-3xl p-10 border border-white/5">
                    <h2 className="text-2xl font-bold mb-4">Ready to save time?</h2>
                    <a
                        href="https://chromewebstore.google.com/detail/iehppeblndjdnnoofdojmdlllcbihode?utm_source=item-share-cb"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-black font-bold hover:bg-white/90 transition-all"
                    >
                        <Chrome className="w-5 h-5" />
                        Get the Extension
                    </a>
                </div>

            </main>
        </div>
    );
}
