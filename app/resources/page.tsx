"use client";

import { useState, useEffect } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Search, FolderOpen, Heart, ChevronRight, BookOpen, Layers } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function ResourcesPage() {
    const [materials, setMaterials] = useState<any[]>([]);
    const [filteredMaterials, setFilteredMaterials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSem, setSelectedSem] = useState<string | null>(null);
    const [mySubjects, setMySubjects] = useState<Set<string>>(new Set());

    // Cache validity duration: 24 hours (in ms)
    const CACHE_DURATION = 24 * 60 * 60 * 1000;

    // Load Favorites from Local Storage
    useEffect(() => {
        const saved = localStorage.getItem("my_subjects");
        if (saved) {
            setMySubjects(new Set(JSON.parse(saved)));
        }
    }, []);

    // Fetch Materials with Caching
    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                // 1. Check Cache
                const cachedDocs = localStorage.getItem("resources_cache");
                if (cachedDocs) {
                    const { timestamp, data } = JSON.parse(cachedDocs);
                    const now = Date.now();

                    if (now - timestamp < CACHE_DURATION) {
                        console.log("Using cached resources");
                        setMaterials(data);
                        setFilteredMaterials(data);
                        setLoading(false);
                        return;
                    }
                }

                console.log("Fetching fresh resources from Firestore");
                const db = getFirestore(app);

                // 1. Get List of Semester Docs
                const semSnapshot = await getDocs(collection(db, "materials"));

                let allSubjects: any[] = [];

                for (const semDoc of semSnapshot.docs) {
                    const semId = semDoc.id;
                    const resourcesSnap = await getDocs(collection(db, "materials", semId, "resources"));

                    const subjects = resourcesSnap.docs.map(doc => ({
                        id: doc.id,
                        sem: semId,
                        ...doc.data(),
                        displayName: doc.data().Subject || doc.data().Name || doc.data().Title || doc.id
                    }));

                    allSubjects = [...allSubjects, ...subjects];
                }

                // Sort Alphabetically
                allSubjects.sort((a, b) => a.displayName.localeCompare(b.displayName));

                setMaterials(allSubjects);
                setFilteredMaterials(allSubjects);

                // Save to Cache
                localStorage.setItem("resources_cache", JSON.stringify({
                    timestamp: Date.now(),
                    data: allSubjects
                }));

            } catch (error) {
                console.error("Error fetching materials:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMaterials();
    }, []);

    // Filter Logic
    useEffect(() => {
        let results = materials;

        if (selectedSem) {
            results = results.filter(m => m.sem === selectedSem);
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            results = results.filter(m =>
                m.displayName.toLowerCase().includes(q) ||
                m.sem.toLowerCase().includes(q)
            );
        }

        setFilteredMaterials(results);
    }, [searchQuery, selectedSem, materials]);


    const toggleFavorite = (id: string) => {
        const newSet = new Set(mySubjects);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setMySubjects(newSet);
        localStorage.setItem("my_subjects", JSON.stringify(Array.from(newSet)));
    };

    const getSemColor = (sem: string) => {
        const map: any = {
            'sem1': 'text-red-400 border-red-500/20 bg-red-500/10',
            'sem2': 'text-blue-400 border-blue-500/20 bg-blue-500/10',
            'sem3': 'text-purple-400 border-purple-500/20 bg-purple-500/10',
            'sem4': 'text-green-400 border-green-500/20 bg-green-500/10',
            'sem5': 'text-orange-400 border-orange-500/20 bg-orange-500/10',
            'sem6': 'text-pink-400 border-pink-500/20 bg-pink-500/10',
            'sem7': 'text-cyan-400 border-cyan-500/20 bg-cyan-500/10',
            'sem8': 'text-indigo-400 border-indigo-500/20 bg-indigo-500/10',
        };
        return map[sem] || 'text-gray-400 border-gray-500/20 bg-gray-500/10';
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
                <div className="absolute top-0 right-1/4 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="relative z-10">
                    <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Study Materials</h1>
                    <p className="text-muted-foreground flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-emerald-400" />
                        Access notes, question papers, and resources.
                    </p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-72 relative z-10">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                    <input
                        type="text"
                        placeholder="Search subjects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:bg-white/10 focus:border-emerald-500/30 transition-all shadow-lg shadow-black/20"
                    />
                </div>
            </div>

            {/* Semester Filters */}
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                <button
                    onClick={() => setSelectedSem(null)}
                    className={`px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap shadow-lg ${selectedSem === null
                        ? "bg-white text-black scale-105"
                        : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                        }`}
                >
                    All
                </button>
                {['sem1', 'sem2', 'sem3', 'sem4', 'sem5', 'sem6', 'sem7', 'sem8'].map(sem => (
                    <button
                        key={sem}
                        onClick={() => setSelectedSem(sem)}
                        className={`px-5 py-2 rounded-full text-sm font-bold transition-all uppercase whitespace-nowrap shadow-lg ${selectedSem === sem
                            ? "bg-emerald-500 text-white scale-105"
                            : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                            }`}
                    >
                        {sem}
                    </button>
                ))}
            </div>

            {/* My Subjects (Favorites) Section */}
            {mySubjects.size > 0 && (
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4 text-white font-bold text-lg">
                        <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                        My Favorites
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
                        {materials.filter(m => mySubjects.has(m.id)).map(subject => (
                            <Link
                                href={`/resources/${subject.sem}/${subject.id}`}
                                key={subject.id}
                                className="min-w-[220px] w-[220px] glass-card rounded-2xl p-5 flex flex-col justify-between h-[140px] group hover:border-emerald-500/30 hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity ${getSemColor(subject.sem).split(' ')[2]}`} />

                                <div>
                                    <div className={`text-[10px] font-bold uppercase tracking-wider mb-3 px-2 py-0.5 w-fit rounded border ${getSemColor(subject.sem)}`}>
                                        {subject.sem}
                                    </div>
                                    <h4 className="font-bold text-white line-clamp-2 leading-tight group-hover:text-emerald-300 transition-colors">{subject.displayName}</h4>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Grid */}
            {loading ? (
                <div className="flex justify-center py-32">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : filteredMaterials.length === 0 ? (
                <div className="text-center py-32 text-muted-foreground glass-card rounded-3xl border-dashed">
                    <FolderOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">No study materials found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredMaterials.map((subject, index) => {
                        const isFav = mySubjects.has(subject.id);
                        return (
                            <motion.div
                                key={subject.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: index * 0.05 }}
                                className="group glass-card rounded-2xl p-5 transition-all hover:bg-white/10 hover:border-emerald-500/30 relative"
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border uppercase ${getSemColor(subject.sem)} font-bold text-lg shadow-lg`}>
                                        {subject.displayName[0]}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-white truncate pr-6 text-lg group-hover:text-emerald-300 transition-colors">{subject.displayName}</h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getSemColor(subject.sem)}`}>
                                                {subject.sem}
                                            </span>
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <Layers className="w-3 h-3" />
                                                {subject.id}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toggleFavorite(subject.id);
                                        }}
                                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors z-20"
                                    >
                                        <Heart className={`w-5 h-5 transition-colors ${isFav ? "text-red-500 fill-red-500 drop-shadow-lg" : "text-white/20 group-hover:text-white/50"}`} />
                                    </button>
                                </div>
                                <Link
                                    href={`/resources/${subject.sem}/${subject.id}`}
                                    className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between cursor-pointer group/link"
                                >
                                    <span className="text-xs font-bold text-gray-500 group-hover/link:text-emerald-400 transition-colors uppercase tracking-wide">View Resources</span>
                                    <ChevronRight className="w-4 h-4 text-gray-500 group-hover/link:translate-x-1 group-hover/link:text-emerald-400 transition-all" />
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
