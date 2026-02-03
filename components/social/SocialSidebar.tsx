"use client";

import { Home, Users, Bookmark } from "lucide-react";
import { motion } from "framer-motion";

interface SocialSidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export default function SocialSidebar({ activeTab, onTabChange }: SocialSidebarProps) {
    const navItems = [
        { id: "Posts", icon: Home, label: "Feed" },
        { id: "Groups", icon: Users, label: "Clubs" },
        { id: "Bookmarks", icon: Bookmark, label: "Bookmarks" },
    ];



    return (
        <div className="hidden lg:flex flex-col w-64 h-[calc(100vh-80px)] sticky top-24 pl-4 pr-6">
            <div className="space-y-6">

                {/* Main Navigation */}
                <div className="space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => onTabChange(item.id)}
                                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? "bg-white text-black font-bold shadow-lg shadow-white/10"
                                    : "text-white/60 hover:bg-white/5 hover:text-white"
                                    }`}
                            >
                                <Icon size={22} className={isActive ? "fill-current" : ""} />
                                <span className="text-sm tracking-wide">{item.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="h-px bg-white/10 mx-4" />

            </div>
        </div>
    );
}
