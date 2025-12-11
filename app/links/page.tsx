"use client";

import React from "react";
import { ArrowLeft, ExternalLink, Link as LinkIcon, ShieldCheck } from "lucide-react";
import Link from "next/link";

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
        <div className="min-h-screen bg-black text-white p-4 pb-24 md:pb-8">
            {/* Header */}
            <div className="max-w-2xl mx-auto flex items-center gap-4 mb-8">
                <Link
                    href="/dashboard"
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-xl font-bold">Important Links</h1>
                    <p className="text-xs text-gray-400">Curated resources for students</p>
                </div>
            </div>

            <div className="max-w-2xl mx-auto space-y-4">
                {LINKS_DATA.map((item, index) => (
                    <a
                        key={index}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group bg-gray-900/50 hover:bg-gray-900 border border-white/5 hover:border-white/10 rounded-xl p-5 transition-all"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1 mr-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                                        {item.title}
                                    </h3>
                                    {item.official && (
                                        <span className="px-1.5 py-0.5 rounded bg-gray-200 text-black text-[10px] font-bold flex items-center gap-1">
                                            Official
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    {item.desc}
                                </p>
                            </div>
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                <ExternalLink className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-blue-400/80 font-medium">
                            <span>Access Link</span>
                            <LinkIcon className="w-3 h-3" />
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}
