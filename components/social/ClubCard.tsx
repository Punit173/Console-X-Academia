"use client";

import { Club } from "@/types/social";
import { motion } from "framer-motion";
import { Users, Link as LinkIcon, Lock } from "lucide-react";
import Image from "next/image";

import { useRouter } from "next/navigation";

interface ClubCardProps {
    club: Club;
    onSubscribe?: (clubId: string) => void;
    isSubscribed?: boolean;
}

export default function ClubCard({ club, onSubscribe, isSubscribed }: ClubCardProps) {
    const router = useRouter();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => router.push(`/social/club/${club.club_id}`)}
            className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden hover:border-violet-500/50 transition-all duration-300 group cursor-pointer"
        >
            {/* Banner */}
            <div className="h-24 bg-gradient-to-r from-violet-900/20 to-fuchsia-900/20 relative">
                {club.banner_url && (
                    <Image
                        src={club.banner_url}
                        alt="Banner"
                        fill
                        className="object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                    />
                )}
            </div>

            <div className="p-4 pt-0 relative">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-black border-2 border-zinc-900 absolute -top-8 left-4 overflow-hidden shadow-lg">
                    {club.icon_url ? (
                        <Image src={club.icon_url} alt={club.name} fill className="object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-white/20">
                            <Users size={24} />
                        </div>
                    )}
                </div>

                <div className="ml-20">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-bold text-white group-hover:text-violet-200 transition-colors">
                                {club.name}
                            </h3>
                            <p className="text-xs text-white/40 mt-1">
                                {club.subscribers.length} Members
                            </p>
                        </div>
                        {club.club_password && (
                            <Lock size={16} className="text-white/30" />
                        )}
                    </div>

                    <p className="text-white/60 text-sm mt-3 line-clamp-2">
                        {club.description}
                    </p>

                    <div className="mt-4 flex gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onSubscribe?.(club.club_id);
                            }}
                            className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-colors ${isSubscribed
                                ? "bg-transparent border-white/30 text-white hover:bg-white/5"
                                : "bg-white border-white text-black hover:bg-white/90"
                                }`}
                        >
                            {isSubscribed ? "Following" : "Join"}
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
