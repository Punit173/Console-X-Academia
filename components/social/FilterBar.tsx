"use client";

import { motion } from "framer-motion";

interface FilterBarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const TABS = ["Posts", "Groups", "Bookmarks"];

export default function FilterBar({ activeTab, onTabChange }: FilterBarProps) {
    return (
        <div className="w-full overflow-x-auto py-4 px-4 sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-white/10">
            <div className="flex gap-3">
                {TABS.map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                        <button
                            key={tab}
                            onClick={() => onTabChange(tab)}
                            className={`relative px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${isActive
                                    ? "text-black bg-white shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                    : "text-white/70 bg-white/5 hover:text-white hover:bg-white/10 border border-white/10"
                                }`}
                        >
                            {tab}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
