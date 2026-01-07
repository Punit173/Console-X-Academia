"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { Search, Filter, ExternalLink, GraduationCap, Building2, User } from "lucide-react";
import { useSearchParams } from "next/navigation";

// Import Data Directly for Maximum Speed (Static Generation)
import intelData from "../../Faculties_SRM/faculty_CINTEL.json";
import ctechData from "../../Faculties_SRM/faculty_CTECH.json";
import dsbsData from "../../Faculties_SRM/faculty_DSBS.json";
import nwcData from "../../Faculties_SRM/faculty_NWC.json";

// Map data to tabs
const DEPARTMENTS = [
    { id: "CINTEL", name: "CINTEL", data: intelData.faculties, label: "CINTEL" },
    { id: "CTECH", name: "CTECH", data: ctechData.faculties, label: "CTECH" },
    { id: "DSBS", name: "DSBS", data: dsbsData.faculties, label: "DSBS" },
    { id: "NWC", name: "NWC", data: nwcData.faculties, label: "NWC" },
];

// Helper: Sanitize & Tokenize Name
const getTokens = (str: string) => {
    return str
        .toLowerCase()
        .replace(/dr\.|mr\.|mrs\.|er\.|prof\./g, "") // Remove titles
        .replace(/[^a-z0-9\s]/g, " ") // Remove special chars
        .split(/\s+/)
        .filter(t => t.length > 2); // Only keep significant tokens (>2 chars)
};

// Helper: Bidirectional Token Match
const isFuzzyMatch = (name1: string, name2: string) => {
    const tokens1 = getTokens(name1); // Query
    const tokens2 = getTokens(name2); // Target

    if (tokens1.length === 0) return true;

    // Strict Mode: ALL query tokens must match at least one target token
    return tokens1.every(t1 =>
        tokens2.some(t2 => t2.includes(t1) || t1.includes(t2))
    );
};

function StaffContent() {
    const params = useSearchParams();
    const [activeTab, setActiveTab] = useState("CINTEL");
    const [searchQuery, setSearchQuery] = useState("");
    const [specializationFilter, setSpecializationFilter] = useState("");

    // Initialize search from URL
    useEffect(() => {
        const q = params.get("q");
        if (q) {
            const cleanQ = q.replace(/\(\d+\)/, "").trim();
            setSearchQuery(cleanQ);
        }
    }, [params]);

    const isSearching = searchQuery.length > 0;

    // Get current dataset based on active tab
    const activeData = useMemo(() => {
        return DEPARTMENTS.find((d) => d.id === activeTab)?.data || [];
    }, [activeTab]);

    // Extract unique specializations for filter dropdown
    const uniqueSpecializations = useMemo(() => {
        const specs = new Set<string>();
        activeData.forEach((faculty: any) => {
            if (faculty.specialization) {
                const tags = faculty.specialization.split(',').map((s: string) => s.trim());
                tags.forEach((tag: string) => {
                    if (tag) specs.add(tag);
                });
            }
        });
        return Array.from(specs).sort();
    }, [activeData]);

    // Filter Logic with Fuzzy Matching
    const filteredFaculty = useMemo(() => {
        return activeData.filter((faculty: any) => {
            const matchesName = isSearching
                ? isFuzzyMatch(searchQuery, faculty.name)
                : true;

            const matchSpec = specializationFilter
                ? faculty.specialization?.toLowerCase().includes(specializationFilter.toLowerCase())
                : true;

            return matchesName && matchSpec;
        });
    }, [activeData, searchQuery, specializationFilter, isSearching]);

    return (
        <div className="w-full min-h-screen pb-20 animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                    <Building2 className="w-8 h-8 text-primary" />
                    Staff Finder
                </h1>
                <p className="text-muted-foreground">
                    Find and connect with faculty members across departments.
                </p>
            </div>

            {/* Controls Container */}
            <div className="glass-card sticky top-24 z-30 p-4 rounded-xl mb-6 shadow-2xl border border-white/10 bg-black/80 backdrop-blur-xl">

                {/* Department Tabs */}
                <div className="flex overflow-x-auto pb-4 sm:pb-0 gap-2 mb-4 no-scrollbar transition-opacity duration-300 opacity-100">
                    {DEPARTMENTS.map((dept) => (
                        <button
                            key={dept.id}
                            onClick={() => {
                                setActiveTab(dept.id);
                                setSpecializationFilter("");
                            }}
                            className={`
whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all
                                ${activeTab === dept.id
                                    ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                                }
`}
                        >
                            {dept.label}
                        </button>
                    ))}
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search Box */}
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder={isSearching ? "Searching all departments..." : `Search ${DEPARTMENTS.find((d) => d.id === activeTab)?.label || "faculty"}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                        />
                        {isSearching && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-white uppercase font-bold"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Specialization Filter Dropdown */}
                    <div className="relative sm:w-64">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none">
                            <Filter className="w-4 h-4" />
                        </div>
                        <select
                            value={specializationFilter}
                            onChange={(e) => setSpecializationFilter(e.target.value)}
                            className="w-full appearance-none bg-black/50 border border-white/10 rounded-lg pl-10 pr-8 py-2.5 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all cursor-pointer text-sm"
                        >
                            <option value="">All Specializations</option>
                            {uniqueSpecializations.map((spec) => (
                                <option key={spec} value={spec} className="bg-zinc-900">
                                    {spec}
                                </option>
                            ))}
                        </select>
                        {/* Custom Arrow because appearance-none removes it */}
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFaculty.length > 0 ? (
                    filteredFaculty.map((faculty: any, idx: number) => (
                        <div
                            key={`${faculty.name}-${idx}`}
                            className="glass-card p-5 rounded-xl border border-white/5 bg-white/5 hover:border-primary/30 hover:bg-white/10 transition-all duration-300 group flex flex-col h-full relative overflow-hidden"
                        >
                            {/* Department Badge (Only show if searching) */}
                            {/* @ts-ignore */}
                            {faculty.deptLabel && (
                                <div className="absolute top-0 right-0 bg-white/10 text-[10px] font-bold px-2 py-1 rounded-bl-lg text-white/50 uppercase tracking-widest backdrop-blur-md">
                                    {/* @ts-ignore */}
                                    {faculty.deptLabel}
                                </div>
                            )}

                            <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xl font-bold text-white shadow-inner shrink-0 border border-white/10">
                                    {faculty.name.replace(/Dr\.|Mr\.|Mrs\./g, "").trim().charAt(0)}
                                </div>
                                {faculty.link && (
                                    <a
                                        href={faculty.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 rounded-lg bg-white/5 hover:bg-primary/20 text-gray-400 hover:text-primary transition-colors"
                                        title="View Profile"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                )}
                            </div>

                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-primary transition-colors">
                                    {faculty.name}
                                </h3>
                                <p className="text-sm font-medium text-primary/80 mb-3 block">
                                    {faculty.designation}
                                </p>

                                {faculty.specialization && (
                                    <div className="flex items-start gap-2 text-xs text-gray-400">
                                        <GraduationCap className="w-4 h-4 shrink-0 mt-0.5 text-gray-500" />
                                        <p className="line-clamp-3 leading-relaxed">
                                            {faculty.specialization}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center text-gray-500">
                        <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium">No faculty found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                )}
            </div>

            {/* Result Count */}
            <div className="mt-6 text-center text-xs text-gray-600 font-mono">
                Showing {filteredFaculty.length} staff members
            </div>
        </div>
    );
}

export default function StaffPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading...</div>}>
            <StaffContent />
        </Suspense>
    );
}
