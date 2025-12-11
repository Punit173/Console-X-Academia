"use client";

import { useState, useEffect } from "react";
import { getFirestore, collection, getDocs, getDoc, doc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Search, FolderOpen, Heart, BookOpen, Download, ChevronRight, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function ResourcesPage() {
    const [materials, setMaterials] = useState<any[]>([]);
    const [filteredMaterials, setFilteredMaterials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSem, setSelectedSem] = useState<string | null>(null);
    const [mySubjects, setMySubjects] = useState<Set<string>>(new Set());

    // Load Favorites from Local Storage
    useEffect(() => {
        const saved = localStorage.getItem("my_subjects");
        if (saved) {
            setMySubjects(new Set(JSON.parse(saved)));
        }
    }, []);

    // Fetch Materials
    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                const db = getFirestore(app);
                // "materials" collection contains docs like "sem1", "sem2"
                // Each "semX" doc has a SUBCOLLECTION "resources"

                // 1. Get List of Semester Docs
                const semSnapshot = await getDocs(collection(db, "materials"));

                let allSubjects: any[] = [];

                for (const semDoc of semSnapshot.docs) {
                    const semId = semDoc.id; // e.g., "sem3"
                    // 2. Fetch Resources Subcollection
                    const resourcesSnap = await getDocs(collection(db, "materials", semId, "resources"));

                    const subjects = resourcesSnap.docs.map(doc => ({
                        id: doc.id,
                        sem: semId,
                        ...doc.data(),
                        // heuristic to find display Name
                        displayName: doc.data().Subject || doc.data().Name || doc.data().Title || doc.id
                    }));

                    allSubjects = [...allSubjects, ...subjects];
                }

                // Sort Alphabetically
                allSubjects.sort((a, b) => a.displayName.localeCompare(b.displayName));

                setMaterials(allSubjects);
                setFilteredMaterials(allSubjects);

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
            'sem1': 'text-red-400 border-red-500/30 bg-red-500/10',
            'sem2': 'text-blue-400 border-blue-500/30 bg-blue-500/10',
            'sem3': 'text-purple-400 border-purple-500/30 bg-purple-500/10',
            'sem4': 'text-green-400 border-green-500/30 bg-green-500/10',
            'sem5': 'text-orange-400 border-orange-500/30 bg-orange-500/10',
            'sem6': 'text-pink-400 border-pink-500/30 bg-pink-500/10',
            'sem7': 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
            'sem8': 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
        };
        return map[sem] || 'text-gray-400 border-gray-500/30 bg-gray-500/10';
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Study Materials</h1>
                    <p className="text-muted-foreground">Access notes, question papers, and resources.</p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                    <input
                        type="text"
                        placeholder="Search subjects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
            </header>

            {/* Semester Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                <button
                    onClick={() => setSelectedSem(null)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${selectedSem === null
                        ? "bg-white text-black"
                        : "bg-white/5 text-white hover:bg-white/10"
                        }`}
                >
                    All
                </button>
                {['sem1', 'sem2', 'sem3', 'sem4', 'sem5', 'sem6', 'sem7', 'sem8'].map(sem => (
                    <button
                        key={sem}
                        onClick={() => setSelectedSem(sem)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors uppercase whitespace-nowrap ${selectedSem === sem
                            ? "bg-primary text-white"
                            : "bg-white/5 text-white hover:bg-white/10"
                            }`}
                    >
                        {sem}
                    </button>
                ))}
            </div>

            {/* My Subjects (Favorites) Section */}
            {mySubjects.size > 0 && (
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4 text-white font-bold">
                        <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                        My Subjects
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4">
                        {materials.filter(m => mySubjects.has(m.id)).map(subject => (
                            <Link
                                href={`/resources/${subject.sem}/${subject.id}`}
                                key={subject.id}
                                className="min-w-[200px] w-[200px] bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between h-[120px] group hover:bg-white/10 transition-all cursor-pointer"
                            >
                                <div>
                                    <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 px-2 py-0.5 w-fit rounded border ${getSemColor(subject.sem)}`}>
                                        {subject.sem}
                                    </div>
                                    <h4 className="font-bold text-white line-clamp-2 leading-tight">{subject.displayName}</h4>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : filteredMaterials.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                    <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No study materials found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMaterials.map((subject) => {
                        const isFav = mySubjects.has(subject.id);
                        return (
                            <div key={subject.id} className="group bg-black/40 border border-white/5 hover:border-white/20 rounded-2xl p-4 transition-all hover:bg-white/5 relative">
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${getSemColor(subject.sem)}`}>
                                        <span className="font-bold text-lg">{subject.displayName[0]}</span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-white truncate pr-6">{subject.displayName}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${getSemColor(subject.sem)}`}>
                                                {subject.sem}
                                            </span>
                                            <span className="text-xs text-muted-foreground truncate">{subject.id}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => toggleFavorite(subject.id)}
                                        className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 transition-colors"
                                    >
                                        <Heart className={`w-5 h-5 transition-colors ${isFav ? "text-red-500 fill-red-500" : "text-white/20 group-hover:text-white/50"}`} />
                                    </button>
                                </div>
                                <Link href={`/resources/${subject.sem}/${subject.id}`} className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between cursor-pointer">
                                    <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">View Resources</span>
                                    <ChevronRight className="w-4 h-4 text-white/50 group-hover:translate-x-1 group-hover:text-primary transition-all" />
                                </Link>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
