"use client";

import { Club } from "@/types/social";

interface SocialRightPanelProps {
    suggestedClubs?: Club[];
}

export default function SocialRightPanel({
    suggestedClubs = [],
}: SocialRightPanelProps) {
    return (
        <div className="hidden xl:flex flex-col w-80 h-[calc(100vh-80px)] sticky top-24 pr-4 pl-6 space-y-6">

            {/* Suggested People/Groups */}
            {suggestedClubs.length > 0 && (
                <div className="bg-[#121212] border border-white/5 rounded-2xl p-4 space-y-4">
                    <h3 className="text-white font-bold text-sm tracking-wide">Suggested Clubs</h3>

                    {suggestedClubs.slice(0, 3).map((club) => (
                        <div key={club.club_id} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#1C1C1E] border border-white/10 flex items-center justify-center overflow-hidden">
                                {club.icon_url ? (
                                    <img src={club.icon_url} alt={club.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xs font-bold text-white">{club.name.substring(0, 2).toUpperCase()}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-white text-sm font-medium truncate">{club.name}</h4>
                                <p className="text-white/30 text-xs truncate">{club.subscribers.length} members</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-white/20 px-2">
                <span>Terms of Service</span>
                <span>Privacy Policy</span>
                <span>Cookie Policy</span>
                <span>Accessibility</span>
                <span>© 2026 Console X</span>
            </div>

        </div>
    );
}
