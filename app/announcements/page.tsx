"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import { app } from "@/lib/firebase"; // Ensure this is correctly initialized
import { useAppData } from "@/components/AppDataContext";
import { Calendar, Bell, ShieldAlert, ArrowRight } from "lucide-react";

export default function AnnouncementsPage() {
    const { data } = useAppData(); // For auth context if needed
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
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch (e) {
            return dateString.replace(/_/g, '/');
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Announcements</h1>
                    <p className="text-muted-foreground">Stay updated with the latest campus news and events.</p>
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : announcements.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                    <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No announcements found.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {announcements.map((item) => {
                        const isAdmin = item.type === "admin";

                        return (
                            <div
                                key={item.id}
                                className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-300 ${isAdmin
                                        ? "bg-black border border-white/10 shadow-2xl shadow-primary/5"
                                        : "bg-white text-black shadow-lg"
                                    }`}
                            >
                                {/* Admin Badge/Accent */}
                                {isAdmin && (
                                    <div className="absolute top-0 right-0 p-4 opacity-50">
                                        <ShieldAlert className="w-24 h-24 text-white/5 -rotate-12 transform translate-x-8 -translate-y-8" />
                                    </div>
                                )}

                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md ${isAdmin ? "bg-white/10 text-white" : "bg-black/5 text-black/60"
                                            }`}>
                                            {item.type || "Event"}
                                        </span>
                                        <div className={`flex items-center gap-1.5 text-xs font-medium ${isAdmin ? "text-white/40" : "text-black/40"
                                            }`}>
                                            <Calendar className="w-3.5 h-3.5" />
                                            {formatDate(item.date)}
                                        </div>
                                    </div>

                                    <h3 className={`text-2xl font-bold mb-3 ${isAdmin ? "text-white" : "text-gray-900"
                                        }`}>
                                        {item.title}
                                    </h3>

                                    {item.para && (
                                        <p className={`text-lg font-medium mb-4 ${isAdmin ? "text-white/80" : "text-gray-700"
                                            }`}>
                                            {item.para}
                                        </p>
                                    )}

                                    {item.desc && (
                                        <div className={`text-sm leading-relaxed mb-6 pt-4 border-t ${isAdmin ? "text-white/60 border-white/10" : "text-gray-600 border-gray-100"
                                            }`}>
                                            {item.desc}
                                        </div>
                                    )}

                                    {/* Image */}
                                    {item.img && (
                                        <div className="mt-4 mb-6 rounded-xl overflow-hidden">
                                            <img src={item.img} alt="Announcement" className="w-full h-auto object-cover max-h-[400px]" />
                                        </div>
                                    )}

                                    {item.link && (
                                        <a
                                            href={item.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`inline-flex items-center gap-2 font-bold text-sm hover:underline ${isAdmin ? "text-blue-400" : "text-blue-600"
                                                }`}
                                        >
                                            Read More <ArrowRight className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
