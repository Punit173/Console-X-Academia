"use client";

import { useState, useEffect } from "react";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, FileText, Download, ExternalLink, GraduationCap, FileQuestion, Youtube } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SubjectResourcePage() {
    const params = useParams();
    const router = useRouter();
    const { sem, subjectId } = params;

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"notes" | "qp" | "syllabus" | "playlist">("notes");

    useEffect(() => {
        if (!sem || !subjectId) return;

        const fetchData = async () => {
            try {
                const db = getFirestore(app);
                const docRef = doc(db, "materials", sem as string, "resources", subjectId as string);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setData({ id: docSnap.id, ...docSnap.data() });
                } else {
                    console.error("No such document!");
                }
            } catch (e) {
                console.error("Error fetching resource:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [sem, subjectId]);

    // --- THEME LOGIC ---
    const getTheme = (semester: string) => {
        const s = semester?.toLowerCase();
        // Default to 'sem5' (orange) if unknown
        const themes: any = {
            'sem1': {
                color: 'red',
                pill: 'text-red-400 border-red-500/30 bg-red-500/10',
                activeTab: 'bg-red-600 text-white shadow-lg shadow-red-500/20',
                iconBg: 'bg-red-500/10 text-red-500',
                groupHover: 'group-hover:border-red-500/50 group-hover:bg-red-500/5',
                textHover: 'group-hover:text-red-400',
                border: 'border-red-500/20'
            },
            'sem2': {
                color: 'blue',
                pill: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
                activeTab: 'bg-blue-600 text-white shadow-lg shadow-blue-500/20',
                iconBg: 'bg-blue-500/10 text-blue-500',
                groupHover: 'group-hover:border-blue-500/50 group-hover:bg-blue-500/5',
                textHover: 'group-hover:text-blue-400',
                border: 'border-blue-500/20'
            },
            'sem3': {
                color: 'purple',
                pill: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
                activeTab: 'bg-purple-600 text-white shadow-lg shadow-purple-500/20',
                iconBg: 'bg-purple-500/10 text-purple-500',
                groupHover: 'group-hover:border-purple-500/50 group-hover:bg-purple-500/5',
                textHover: 'group-hover:text-purple-400',
                border: 'border-purple-500/20'
            },
            'sem4': {
                color: 'green',
                pill: 'text-green-400 border-green-500/30 bg-green-500/10',
                activeTab: 'bg-green-600 text-white shadow-lg shadow-green-500/20',
                iconBg: 'bg-green-500/10 text-green-500',
                groupHover: 'group-hover:border-green-500/50 group-hover:bg-green-500/5',
                textHover: 'group-hover:text-green-400',
                border: 'border-green-500/20'
            },
            'sem5': {
                color: 'orange',
                pill: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
                activeTab: 'bg-orange-600 text-white shadow-lg shadow-orange-500/20',
                iconBg: 'bg-orange-500/10 text-orange-500',
                groupHover: 'group-hover:border-orange-500/50 group-hover:bg-orange-500/5',
                textHover: 'group-hover:text-orange-400',
                border: 'border-orange-500/20'
            },
            'sem6': {
                color: 'pink',
                pill: 'text-pink-400 border-pink-500/30 bg-pink-500/10',
                activeTab: 'bg-pink-600 text-white shadow-lg shadow-pink-500/20',
                iconBg: 'bg-pink-500/10 text-pink-500',
                groupHover: 'group-hover:border-pink-500/50 group-hover:bg-pink-500/5',
                textHover: 'group-hover:text-pink-400',
                border: 'border-pink-500/20'
            },
            'sem7': {
                color: 'cyan',
                pill: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
                activeTab: 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20',
                iconBg: 'bg-cyan-500/10 text-cyan-500',
                groupHover: 'group-hover:border-cyan-500/50 group-hover:bg-cyan-500/5',
                textHover: 'group-hover:text-cyan-400',
                border: 'border-cyan-500/20'
            },
            'sem8': {
                color: 'indigo',
                pill: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
                activeTab: 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20',
                iconBg: 'bg-indigo-500/10 text-indigo-500',
                groupHover: 'group-hover:border-indigo-500/50 group-hover:bg-indigo-500/5',
                textHover: 'group-hover:text-indigo-400',
                border: 'border-indigo-500/20'
            }
        };
        return themes[s] || themes['sem5'];
    };

    const theme = getTheme(sem as string);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mb-4 ${theme.pill.split(' ')[0]}`} style={{ borderColor: 'currentColor', borderTopColor: 'transparent', borderLeftColor: 'transparent', borderRightColor: 'transparent' }}></div>
                <p className="text-muted-foreground animate-pulse">Loading resources...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-white mb-2">Resource Not Found</h2>
                <button onClick={() => router.back()} className="text-primary hover:underline">Go Back</button>
            </div>
        );
    }

    // Helper to parse notes/qp maps or arrays
    const getItems = (source: any) => {
        if (Array.isArray(source)) {
            return source;
        }
        if (source && source.content) {
            return Object.entries(source.content).map(([key, val]: any) => ({
                title: key,
                link: val
            }));
        }
        return [];
    };

    const notes = getItems(data.ppts || data.notes || data.ppt);
    const questionPapers = getItems(data.pyqs || data.pyq || data.previous_year_questions || data.question_papers);
    const playlist = getItems(data.playlist || data.youtube_playlist);
    const syllabus = data.syllabus || "";

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded border ${theme.pill}`}>
                            {sem}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">{data.id}</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                        {data.displayName || data.subject || data.Subject || data.Name || "Subject Details"}
                    </h1>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 p-1 bg-white/5 rounded-xl w-fit border border-white/10">
                <button
                    onClick={() => setActiveTab("notes")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "notes" ? theme.activeTab : "text-gray-400 hover:text-white"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Notes
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab("qp")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "qp" ? theme.activeTab : "text-gray-400 hover:text-white"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <FileQuestion className="w-4 h-4" />
                        Papers
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab("syllabus")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "syllabus" ? theme.activeTab : "text-gray-400 hover:text-white"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        Syllabus
                    </div>
                </button>
                {playlist.length > 0 && (
                    <button
                        onClick={() => setActiveTab("playlist")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "playlist" ? theme.activeTab : "text-gray-400 hover:text-white"
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Youtube className="w-4 h-4" />
                            Playlist
                        </div>
                    </button>
                )}
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {activeTab === "notes" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-in">
                        {notes.length > 0 ? (
                            notes.map((note: any, idx: number) => (
                                <a
                                    key={idx}
                                    href={note.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`group bg-white/5 border border-white/10 rounded-xl p-5 transition-all flex items-start gap-4 ${theme.groupHover}`}
                                >
                                    <div className={`p-3 rounded-lg transition-colors ${theme.iconBg} ${theme.groupHover ? 'bg-opacity-20' : ''}`}>
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-bold text-white transition-colors capitalize truncate ${theme.textHover}`}>
                                            {note.title.replace(/_/g, ' ')}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                            View PDF <ExternalLink className="w-3 h-3" />
                                        </p>
                                    </div>
                                </a>
                            ))
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed border-white/10 rounded-xl">
                                <FileText className="w-12 h-12 mb-4 opacity-20" />
                                <p>No notes available yet.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "qp" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-in">
                        {questionPapers.length > 0 ? (
                            questionPapers.map((qp: any, idx: number) => (
                                <a
                                    key={idx}
                                    href={qp.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`group bg-white/5 border border-white/10 rounded-xl p-5 transition-all flex items-start gap-4 ${theme.groupHover}`}
                                >
                                    <div className={`p-3 rounded-lg transition-colors ${theme.iconBg} ${theme.groupHover ? 'bg-opacity-20' : ''}`}>
                                        <FileQuestion className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-bold text-white transition-colors capitalize truncate ${theme.textHover}`}>
                                            {qp.title.replace(/_/g, ' ')}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                            Download <Download className="w-3 h-3" />
                                        </p>
                                    </div>
                                </a>
                            ))
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed border-white/10 rounded-xl">
                                <FileQuestion className="w-12 h-12 mb-4 opacity-20" />
                                <p>No question papers available yet.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "syllabus" && (
                    <div className="animate-slide-in">
                        {syllabus ? (
                            <div className={`bg-white/5 border border-white/10 rounded-xl p-6`}>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-white">Syllabus PDF</h3>
                                    <a
                                        href={syllabus}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`px-4 py-2 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${theme.activeTab}`}
                                    >
                                        <Download className="w-4 h-4" />
                                        Download Syllabus
                                    </a>
                                </div>
                                <div className="aspect-[16/9] w-full bg-black/50 rounded-lg flex items-center justify-center border border-white/5">
                                    <iframe src={syllabus} className="w-full h-full rounded-lg" title="Syllabus" />
                                </div>
                            </div>
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed border-white/10 rounded-xl">
                                <GraduationCap className="w-12 h-12 mb-4 opacity-20" />
                                <p>Syllabus not found.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "playlist" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-in">
                        {playlist.length > 0 ? (
                            playlist.map((play: any, idx: number) => (
                                <a
                                    key={idx}
                                    href={play.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`group bg-white/5 border border-white/10 rounded-xl p-5 transition-all flex items-start gap-4 ${theme.groupHover}`}
                                >
                                    <div className={`p-3 rounded-lg transition-colors ${theme.iconBg} ${theme.groupHover ? 'bg-opacity-20' : ''}`}>
                                        <Youtube className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-bold text-white transition-colors capitalize truncate ${theme.textHover}`}>
                                            {play.title.replace(/_/g, ' ')}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                            Watch Video <ExternalLink className="w-3 h-3" />
                                        </p>
                                    </div>
                                </a>
                            ))
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed border-white/10 rounded-xl">
                                <Youtube className="w-12 h-12 mb-4 opacity-20" />
                                <p>No playlist videos available.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
