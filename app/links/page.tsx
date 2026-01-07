"use client";

import React, { useState } from "react";
import { ArrowLeft, ExternalLink, Link as LinkIcon, ShieldCheck, CheckCircle, Globe } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Data from Android App's imp_links_data.dart
const LINKS_DATA = [
    // --- Official Links ---
    {
        title: "SRMIST Events",
        desc: "Stay updated on university events, seminars, and workshops.",
        url: "https://www.srmist.edu.in/events/",
        official: true
    },
    {
        title: "SRM Leave Application",
        desc: "Submit and track staff and student leave applications.",
        url: "http://10.1.105.62/srmleaveapp",
        official: true
    },
    {
        title: "SRM Student Dashboard",
        desc: "Access student services, announcements, and personal academic data.",
        url: "https://sd.srmist.edu.in/",
        official: true
    },
    {
        title: "SRM Staff Finder",
        desc: "Search for faculty and staff contact details within SRMIST.",
        url: "https://www.srmist.edu.in/staff-finder/",
        official: true
    },

    // --- Non-Official Links ---
    {
        title: "The Helpers",
        desc: "Access semesters study materials and resources",
        url: "https://thehelpers.vercel.app/",
        official: false
    },
    {
        title: "Kaizen Klass",
        desc: "Learn and practice topics with structured lessons.",
        url: "https://kaizenklass.xyz/",
        official: false
    },
    {
        title: "Uni Clubs Portal",
        desc: "Browse and join student clubs and communities in your university.",
        url: "https://uni-clubs.vercel.app/",
        official: false
    },
    {
        title: "What's in Mess",
        desc: "Check daily mess menu and meal updates.",
        url: "https://whatsinmess.vercel.app/",
        official: false
    },
    {
        title: "Better Lab",
        desc: "Better substitute for SRM eLab",
        url: "https://better-lab.vercel.app/",
        official: false
    },
    {
        title: "Gradex",
        desc: "CGPA calculator",
        url: "https://gradex.vercel.app/",
        official: false
    },
];

export default function LinksPage() {
    return (
        <div className="w-full animate-fade-in space-y-8 pb-20 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-blue-900/30 pb-6 relative">
                <Link href="/dashboard" className="absolute -top-8 left-0 text-blue-400 hover:text-white flex items-center gap-1 text-sm transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Link>

                <div className="absolute -left-4 top-0 w-20 h-20 bg-blue-900/20 blur-3xl rounded-full pointer-events-none"></div>
                <div className="relative mt-4">
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2 drop-shadow-sm flex items-center gap-2">
                        Important <span className="text-blue-200">Links</span>
                        <LinkIcon className="w-6 h-6 text-blue-400 ml-2 opacity-80" />
                    </h1>
                    <p className="text-blue-100/70 text-sm font-medium">
                        Curated collection of official and student-made resources.
                    </p>
                </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {LINKS_DATA.map((item, index) => (
                    <a
                        key={index}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative rounded-xl p-6 border border-blue-900/30 bg-slate-950/60 hover:bg-blue-950/30 hover:border-blue-500/40 transition-all duration-300 flex flex-col justify-between gap-4 group overflow-hidden h-full min-h-[160px]"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        {/* Subtle Glow */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                        <div className="flex-1 min-w-0 relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                {item.official ? (
                                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-blue-300 bg-blue-950/80 border border-blue-800/50 px-2 py-1 rounded">
                                        <ShieldCheck className="w-3 h-3" /> Official
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-purple-300 bg-purple-950/80 border border-purple-800/50 px-2 py-1 rounded">
                                        <Globe className="w-3 h-3" /> External
                                    </span>
                                )}
                                <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
                            </div>

                            <h3 className="font-bold text-white text-lg leading-tight group-hover:text-blue-100 transition-colors mb-2">
                                {item.title}
                            </h3>
                            <p className="text-sm text-blue-100/60 line-clamp-2 leading-relaxed">
                                {item.desc}
                            </p>
                        </div>

                        {/* Bottom Decoration */}
                        <div className="relative z-10 pt-4 mt-auto border-t border-white/5 flex items-center justify-between text-xs text-gray-500 group-hover:text-blue-300 transition-colors">
                            <span>Open Resource</span>
                            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}

function ArrowRight(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    );
}
