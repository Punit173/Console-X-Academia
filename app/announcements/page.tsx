"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useAppData } from "@/components/AppDataContext";
import { Calendar, Bell, ShieldAlert, ArrowRight, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

export default function AnnouncementsPage() {
    const { data } = useAppData();
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const db = getFirestore(app);
                const snapshot = await getDocs(collection(db, "announcement"));

                const eventsList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Sort logic matching Android app (Latest first)
                eventsList.sort((a: any, b: any) => {
                    const dateA = parseDate(a.date);
                    const dateB = parseDate(b.date);
                    return dateB.getTime() - dateA.getTime();
                });

                setAnnouncements(eventsList);
            } catch (error) {
                console.error("Error fetching announcements:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnnouncements();
    }, []);

    const parseDate = (dateString: string) => {
        if (!dateString) return new Date(0);
        try {
            const parts = dateString.split('_'); // MM_DD_YYYY
            return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
        } catch (e) {
            return new Date(0);
        }
    };

    const formatDate = (dateString: string) => {
        try {
            const date = parseDate(dateString);
            return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        } catch (e) {
            return dateString.replace(/_/g, '/');
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6 relative overflow-hidden">
                <div className="absolute top-0 right-1/4 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="relative z-10">
                    <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Announcements</h1>
                    <p className="text-muted-foreground flex items-center gap-2">
                        <Bell className="w-4 h-4 text-blue-400" />
                        Latest updates from campus & administration
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-32">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : announcements.length === 0 ? (
                <div className="text-center py-32 text-muted-foreground bg-white/5 rounded-3xl border border-white/5">
                    <Bell className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg">No announcements found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {announcements.map((item, index) => {
                        const isAdmin = item.type === "admin";

                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                className={`group relative overflow-hidden rounded-3xl p-6 md:p-8 transition-all duration-500 
                                    ${isAdmin
                                        ? "bg-gradient-to-br from-neutral-900 to-black border border-white/10 hover:border-red-500/30"
                                        : "bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-white/10"
                                    }`}
                            >
                                {/* Decorative Glow */}
                                <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[80px] transition-all duration-700 opacity-0 group-hover:opacity-100 ${isAdmin ? "bg-red-500/10" : "bg-blue-500/10"}`} />

                                <div className="relative z-10 flex flex-col h-full">
                                    {/* Meta Header */}
                                    <div className="flex items-center justify-between gap-4 mb-6">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${isAdmin
                                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                                : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                            }`}>
                                            {item.type || "Update"}
                                        </span>
                                        <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {formatDate(item.date)}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold text-white mb-3 leading-tight group-hover:text-blue-200 transition-colors">
                                            {item.title}
                                        </h3>

                                        {/* Optional Image */}
                                        {item.img && (
                                            <div className="my-5 rounded-2xl overflow-hidden border border-white/10 relative aspect-video group-hover:scale-[1.02] transition-transform duration-500">
                                                <img
                                                    src={item.img}
                                                    alt="Announcement Media"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                                            </div>
                                        )}

                                        {item.para && (
                                            <p className="text-gray-300 font-medium mb-3 leading-relaxed">
                                                {item.para}
                                            </p>
                                        )}

                                        {item.desc && (
                                            <div className="text-sm text-gray-400 leading-relaxed border-l-2 border-white/10 pl-4 py-1">
                                                {item.desc}
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer Action */}
                                    {item.link && (
                                        <div className="mt-6 pt-6 border-t border-white/5">
                                            <a
                                                href={item.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`inline-flex items-center gap-2 text-sm font-bold transition-all ${isAdmin
                                                        ? "text-red-400 hover:text-red-300"
                                                        : "text-blue-400 hover:text-blue-300"
                                                    }`}
                                            >
                                                Visit Link <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
