"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, ArrowLeft, GraduationCap, Calculator, ChevronDown, Sparkles, Download, X, Loader2, RefreshCw, BarChart3, FileSpreadsheet, BookOpen, Check } from "lucide-react";
import Link from "next/link";
import { useAppData } from "@/components/AppDataContext";
import { motion, AnimatePresence } from "framer-motion";

// Grade to grade point mapping
const GRADE_POINTS: Record<string, number> = {
    "O": 10,
    "A+": 9,
    "A": 8,
    "B+": 7,
    "B": 6,
    "C": 5,
    "U": 0, "W": 0, "Ab": 0, "I": 0, "*": 0
};

const GRADE_COLORS: Record<string, string> = {
    "O": "text-green-500",      // Pure Green for Outstanding
    "A+": "text-teal-400",      // Teal/Cyan for A+
    "A": "text-cyan-400",       // Cyan/Blue for A
    "B+": "text-blue-400",      // Blue for B+
    "B": "text-indigo-400",     // Indigo for B
    "C": "text-yellow-400",     // Yellow for C
    "P": "text-orange-300",
    "F": "text-red-500",
    "Ab": "text-red-600",
    "I": "text-red-600",
    "W": "text-gray-500",
    "U": "text-red-500"
};

const LOADING_MESSAGES = [
    "Establishing Uplink...",
    "Authenticating NetID...",
    "Encrypting Credentials...",
    "Fetching Academic Records...",
    "Parsing Raw Transcripts...",
    "Calculating GPA...",
    "Finalizing Data..."
];

interface CourseGrade {
    title: string;
    credit: number;
    grade: string;
    semester: string;
    originalCredit?: number; // For tracking official vs modified
    originalGrade?: string;
}

export default function CGPACalculatorPage() {
    const { data } = useAppData();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<'predictor' | 'results'>('results');

    // --- State: Predictor ---
    const [predictorCourses, setPredictorCourses] = useState<CourseGrade[]>([]);
    const [predictorCGPA, setPredictorCGPA] = useState<number>(0.0);
    const [predictorCredits, setPredictorCredits] = useState<number>(0);

    // --- State: Results ---
    const [resultCourses, setResultCourses] = useState<CourseGrade[]>([]);
    const [resultCGPA, setResultCGPA] = useState<number>(0.0);
    const [scrapedSGPAs, setScrapedSGPAs] = useState<Record<string, number>>({});
    const [openSemesters, setOpenSemesters] = useState<Record<string, boolean>>({});
    const [resultCredits, setResultCredits] = useState<number>(0);

    // --- State: Import ---
    const [showImportModal, setShowImportModal] = useState(false);
    const [netId, setNetId] = useState("");
    const [password, setPassword] = useState("");
    const [isImporting, setIsImporting] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const [savedCreds, setSavedCreds] = useState<{ netid: string } | null>(null);
    const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);

    // --- Helpers ---
    const calculateStats = (courses: CourseGrade[]) => {
        let pts = 0;
        let creds = 0;
        courses.forEach(c => {
            if (c.credit > 0) {
                pts += (GRADE_POINTS[c.grade] ?? 0) * c.credit;
                creds += c.credit;
            }
        });
        return {
            gpa: creds > 0 ? pts / creds : 0.0,
            credits: creds
        };
    };

    const groupCourses = (courses: CourseGrade[]) => {
        const grouped = courses.reduce((acc, course) => {
            const sem = course.semester || "Unknown";
            if (!acc[sem]) acc[sem] = [];
            acc[sem].push(course);
            return acc;
        }, {} as Record<string, CourseGrade[]>);

        const sortedKeys = Object.keys(grouped).sort((a, b) => {
            const numA = parseInt(a.replace(/\D/g, '')) || 999;
            const numB = parseInt(b.replace(/\D/g, '')) || 999;
            if (numA !== numB) return numB - numA; // Descending order
            return b.localeCompare(a);
        });

        return { grouped, sortedKeys };
    };

    // --- Effects ---
    useEffect(() => {
        const loadData = () => {
            try {
                // Load Predictor Data - Always from timetable (Android parity)
                if (data?.timetable?.courses) {
                    // Default predictor population from timetable
                    const initial: CourseGrade[] = data.timetable.courses
                        .filter((c: any) => c.credit > 0)
                        .map((c: any) => ({
                            title: c.course_title || "Course",
                            credit: c.credit || 3,
                            grade: "O",
                            semester: c.semester ? `Semester ${c.semester}` : "Current"
                        }));
                    setPredictorCourses(initial);
                }

                // Load Result Data
                const storedResults = localStorage.getItem("cgpa-result-courses");
                if (storedResults) {
                    setResultCourses(JSON.parse(storedResults));
                    setActiveTab('results');
                }
                const storedSGPAs = localStorage.getItem("cgpa-scraped-sgpas");
                if (storedSGPAs) {
                    setScrapedSGPAs(JSON.parse(storedSGPAs));
                }

                // Load Creds
                const storedCreds = localStorage.getItem("portal-creds");
                if (storedCreds) {
                    const parsed = JSON.parse(storedCreds);
                    setSavedCreds({ netid: parsed.netid }); // Don't store password in state memory for now
                }

            } catch (e) {
                console.error("Error loading data:", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [data]);

    useEffect(() => {
        const stats = calculateStats(predictorCourses);
        setPredictorCGPA(stats.gpa);
        setPredictorCredits(stats.credits);
        // Removed localStorage save to match Android behavior (reset on load)
    }, [predictorCourses]);

    useEffect(() => {
        // Hybrid Calculation: Use Scraped SGPA for old semesters (if avail) + Live Calc for Current
        const { grouped, sortedKeys } = groupCourses(resultCourses);
        if (sortedKeys.length === 0) {
            setResultCGPA(0);
            setResultCredits(0);
            return;
        }

        let totalPts = 0;
        let totalCreds = 0;

        // Assume sortedKeys[0] is "Current/Latest" -> Always calculate manually
        // Others -> Use Scraped SGPA if available
        const latestKey = sortedKeys[0];

        sortedKeys.forEach((key, index) => {
            const semCourses = grouped[key];
            const semStats = calculateStats(semCourses);

            // Determine SGPA to use
            let sgpa = semStats.gpa;
            if (key !== latestKey && scrapedSGPAs[key] !== undefined) {
                sgpa = scrapedSGPAs[key];
            }

            // Add to totals
            // Note: If using scraped SGPA, points = SGPA * credits
            totalPts += sgpa * semStats.credits;
            totalCreds += semStats.credits;
        });

        const hybridCGPA = totalCreds > 0 ? totalPts / totalCreds : 0.0;

        setResultCGPA(hybridCGPA);
        setResultCredits(totalCreds);

        if (resultCourses.length > 0) {
            localStorage.setItem("cgpa-result-courses", JSON.stringify(resultCourses));
        }
    }, [resultCourses, scrapedSGPAs]);

    useEffect(() => {
        if (Object.keys(scrapedSGPAs).length > 0) {
            localStorage.setItem("cgpa-scraped-sgpas", JSON.stringify(scrapedSGPAs));
        }
    }, [scrapedSGPAs]);

    // --- Efcts: Loading Msg ---
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isImporting) {
            let i = 0;
            setLoadingMsg(LOADING_MESSAGES[0]);
            interval = setInterval(() => {
                i = (i + 1) % LOADING_MESSAGES.length;
                setLoadingMsg(LOADING_MESSAGES[i]);
            }, 800);
        }
        return () => clearInterval(interval);
    }, [isImporting]);


    // --- Handlers: Predictor ---
    const addPredictorCourse = () => {
        setPredictorCourses([...predictorCourses, { title: "", credit: 3, grade: "O", semester: "New" }]);
    };

    // --- Handlers: Common Update/Remove ---
    const removeCourse = (isPredictor: boolean, courseToRem: CourseGrade) => {
        if (isPredictor) {
            setPredictorCourses(predictorCourses.filter(c => c !== courseToRem));
        } else {
            setResultCourses(resultCourses.filter(c => c !== courseToRem));
        }
    };

    const updateCourse = (isPredictor: boolean, courseToUp: CourseGrade, field: keyof CourseGrade, value: any) => {
        const setter = isPredictor ? setPredictorCourses : setResultCourses;
        const currentList = isPredictor ? predictorCourses : resultCourses;

        // Constraint: For imported courses, credit can only be 0 or originalCredit
        if (!isPredictor && field === 'credit' && courseToUp.originalCredit !== undefined) {
            const numVal = Number(value);
            if (numVal !== 0 && numVal !== courseToUp.originalCredit) {
                return; // Ignore invalid credit change
            }
        }

        const newList = currentList.map(c => {
            if (c === courseToUp) return { ...c, [field]: value };
            return c;
        });
        setter(newList);
    };

    // --- Handlers: Import ---
    const fetchScraperData = async (nid: string, pwd: string) => {
        const storedSession = localStorage.getItem("academia-session-data");
        let sessionData = null;
        if (storedSession) {
            try { sessionData = JSON.parse(storedSession); } catch { }
        }

        const payload: any = { netid: nid, password: pwd };
        if (sessionData) payload.session_data = sessionData;

        const response = await fetch('/api/proxy-scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const res = await response.json();

        if (!response.ok) {
            throw new Error(res.error || 'Failed to fetch data');
        }

        // Update session if present
        if (res.session_data) {
            localStorage.setItem("academia-session-data", JSON.stringify(res.session_data));
        }

        return res;
    };

    const processImportData = (result: any) => {
        const newCourses: CourseGrade[] = [];
        const newSGPAs: Record<string, number> = {};

        // Raw Tables (Past)
        if (result.raw_tables && Array.isArray(result.raw_tables)) {
            const tableMatrix = result.raw_tables[0]; // Assuming first element is the matrix
            if (Array.isArray(tableMatrix)) {
                let currentSemForSGPA: string | null = null;

                tableMatrix.forEach((row: any[]) => {
                    // Check for Course Row
                    if (Array.isArray(row) && row.length === 6) {
                        const sem = row[0];
                        const credit = Number(row[4]);
                        const grade = row[5];
                        if (!isNaN(credit) && GRADE_POINTS.hasOwnProperty(grade) && !isNaN(Number(sem))) {
                            const semLabel = `Semester ${sem}`;
                            newCourses.push({
                                title: row[3] || "Course",
                                credit,
                                grade,
                                semester: semLabel,
                                originalCredit: credit,
                                originalGrade: grade
                            });
                            currentSemForSGPA = semLabel;
                        }
                    }
                    // Check for SGPA Row
                    if (Array.isArray(row) && row.length >= 2 && row[0] === "SGPA" && currentSemForSGPA) {
                        const sgpaVal = parseFloat(row[1]);
                        if (!isNaN(sgpaVal)) {
                            newSGPAs[currentSemForSGPA] = sgpaVal;
                        }
                    }
                });
            }
        }
        // Semester Results (Current)
        if (result.semester_results && result.semester_results.length > 1) {
            const resultsTable = result.semester_results[1];
            if (Array.isArray(resultsTable)) {
                resultsTable.forEach((row: any[]) => {
                    if (Array.isArray(row) && row.length >= 8) {
                        const sem = row[1];
                        const credit = Number(row[4]);
                        const grade = row[7];
                        if (!isNaN(credit) && GRADE_POINTS.hasOwnProperty(grade) && !isNaN(Number(sem))) {
                            newCourses.push({
                                title: row[3] || "Course",
                                credit,
                                grade,
                                semester: `Semester ${sem}`,
                                originalCredit: credit,
                                originalGrade: grade
                            });
                        }
                    }
                });
            }
        }
        return { newCourses, newSGPAs };
    };

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsImporting(true);
        setImportError(null);
        try {
            const data = await fetchScraperData(netId, password);
            const { newCourses, newSGPAs } = processImportData(data);

            if (newCourses.length === 0) throw new Error("No valid course data found.");

            setResultCourses(newCourses);
            setScrapedSGPAs(newSGPAs);

            // Save creds logic
            const credsToSave = { netid: netId, password: password };
            localStorage.setItem("portal-creds", JSON.stringify(credsToSave));
            setSavedCreds({ netid: netId });

            setShowImportModal(false);
            setNetId("");
            setPassword("");
            setActiveTab('results'); // Switch to results tab automatically
            // alert(`Imported ${newCourses.length} courses.`); // Removed alert
        } catch (err: any) {
            setImportError(err.message || "Import failed.");
        } finally {
            setIsImporting(false);
        }
    };

    const handleRefresh = async () => {
        const stored = localStorage.getItem("portal-creds");
        if (!stored) return;
        const { netid, password } = JSON.parse(stored);

        setIsImporting(true); // Reuse state for loading spinner on refresh button
        try {
            const data = await fetchScraperData(netid, password);
            const { newCourses, newSGPAs } = processImportData(data);
            if (newCourses.length > 0) {
                setResultCourses(newCourses);
                setScrapedSGPAs(newSGPAs);
                alert("Results refreshed successfully!");
            }
        } catch (e) {
            console.error(e);
            alert("Refresh failed. Please update credentials.");
        } finally {
            setIsImporting(false);
        }
    };


    if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-orange-500" /></div>;

    return (
        <div className="min-h-screen p-4 pb-24 md:pb-8 animate-fade-in relative">

            {/* --- Modal moved to top level --- */}
            <AnimatePresence>
                {showImportModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#111] border border-orange-500/20 rounded-2xl w-full max-w-md p-6 relative shadow-2xl"
                        >
                            <button onClick={() => setShowImportModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                            <h2 className="text-xl font-bold text-white mb-2">Import Semester Results</h2>
                            <p className="text-sm text-red-400 font-semibold mb-6 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                ⚠️ Enter your SRM Student Portal credentials (NOT Academia)
                            </p>
                            <form onSubmit={handleImport} className="space-y-4">
                                <input type="text" value={netId} onChange={e => setNetId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500/50" placeholder="NetID (without '@srmist.edu.in')" required />
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500/50" placeholder="Password" required />
                                {importError && <p className="text-red-400 text-sm">{importError}</p>}
                                <button type="submit" disabled={isImporting} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2">
                                    {isImporting ? (
                                        <>
                                            <Loader2 className="animate-spin w-5 h-5" />
                                            <span>{loadingMsg}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-5 h-5" /> Import Results
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>


            <div className="fixed top-0 left-0 right-0 h-[500px] bg-orange-500/10 blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto flex items-center gap-4 mb-6 pt-4">
                <Link href={data ? "/dashboard" : "/"} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5"><ArrowLeft className="w-5 h-5" /></Link>
                <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                        <Calculator className="w-6 h-6 text-orange-500" />
                        GPA Calculator & Results
                    </h1>
                </div>
            </div>

            <div className="max-w-7xl mx-auto space-y-6">

                {/* Tabs */}
                <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 w-full md:w-fit overflow-x-auto">

                    <button
                        onClick={() => setActiveTab('results')}
                        className={`flex-1 md:flex-none whitespace-nowrap px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'results' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        <FileSpreadsheet className="w-4 h-4" /> Semester Results
                    </button>
                    <button
                        onClick={() => setActiveTab('predictor')}
                        className={`flex-1 md:flex-none whitespace-nowrap px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'predictor' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Sparkles className="w-4 h-4" /> GPA Predictor
                    </button>
                </div>


                {activeTab === 'predictor' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        {/* Predictor Stats */}
                        <div className="w-full relative overflow-hidden rounded-3xl glass-card border-orange-500/20 p-6 text-center group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
                                <div className="flex flex-col items-center">
                                    <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Projected CGPA</div>
                                    <div className="text-5xl md:text-7xl font-black text-white drop-shadow-2xl">{(predictorCGPA || 0).toFixed(2)}</div>
                                </div>
                            </div>
                            <div className="mt-4 text-sm text-gray-400">Based on manual entries. Use this to simulate future semesters.</div>
                        </div>

                        <div className="flex justify-end">
                            <button onClick={addPredictorCourse} className="bg-white text-black font-bold px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> Add Prediction Course</button>
                        </div>

                        {/* Predictor List - Flat List (Android Style) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {predictorCourses.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <p className="text-xl font-bold">No courses found</p>
                                    <p className="text-sm">Add courses to calculate CGPA</p>
                                </div>
                            ) : (
                                predictorCourses.map((course, i) => (
                                    <div key={i} className="glass-card rounded-2xl border border-white/5 p-4 bg-[#111] relative hover:z-50 transition-all">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1 pr-2">
                                                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{course.semester || "Current"}</div>
                                                <h3 className="text-base font-medium text-white line-clamp-2">{course.title || `Course ${i + 1}`}</h3>
                                            </div>
                                            <button onClick={() => removeCourse(true, course)} className="text-gray-600 hover:text-red-400 p-1"><Trash2 className="w-5 h-5" /></button>
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="flex-1 space-y-1">
                                                <label className="text-xs text-gray-500">Credits</label>
                                                <div className="h-12 bg-black rounded-lg px-3 flex items-center">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="20"
                                                        value={course.credit}
                                                        onChange={e => updateCourse(true, course, "credit", Number(e.target.value) || 0)}
                                                        className="w-full bg-transparent border-none p-0 text-white font-mono focus:ring-0"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex-[1.5] space-y-1">
                                                <label className="text-xs text-gray-500">Grade</label>
                                                <div className="relative group h-12 bg-black rounded-lg w-full">
                                                    {/* Trigger */}
                                                    <div className="absolute inset-0 px-3 flex items-center justify-between cursor-pointer">
                                                        <span className="text-white font-bold">{course.grade}</span>
                                                        <ChevronDown className="w-4 h-4 text-gray-500 group-hover:rotate-180 transition-transform" />
                                                    </div>

                                                    {/* Custom Dropdown Menu */}
                                                    <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-900 border border-white/20 rounded-lg shadow-2xl overflow-hidden hidden group-hover:block z-50 max-h-48 overflow-y-auto">
                                                        {Object.keys(GRADE_POINTS).map(g => (
                                                            <div
                                                                key={g}
                                                                onClick={() => updateCourse(true, course, "grade", g)}
                                                                className="px-3 py-2 text-sm text-white hover:bg-white/10 cursor-pointer flex items-center justify-between transition-colors"
                                                            >
                                                                {g}
                                                                {course.grade === g && <Check className="w-3 h-3 text-orange-500" />}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}


                {activeTab === 'results' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        {/* Results Stats */}
                        <div className="w-full relative overflow-hidden rounded-3xl glass-card border-orange-500/20 p-6 text-center group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
                                <div className="flex flex-col items-center">
                                    <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Exam Results CGPA</div>
                                    <div className="text-5xl md:text-7xl font-black text-white drop-shadow-2xl">{(resultCGPA || 0).toFixed(2)}</div>
                                </div>
                                <div className="hidden md:block w-px h-16 bg-white/10" />
                                <div className="flex flex-col items-center mt-4 md:mt-0">
                                    <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Total Credits</div>
                                    <div className="text-3xl md:text-5xl font-black text-white/50">{resultCredits}</div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-400" /> Official Transcript Data</h2>
                            <div className="flex gap-2 w-full md:w-auto">
                                {savedCreds ? (
                                    <>
                                        <button onClick={handleRefresh} disabled={isImporting} className="flex-1 md:flex-none bg-white/10 text-white font-bold px-3 py-2 rounded-lg hover:bg-white/20 flex items-center justify-center gap-2 text-xs border border-white/10">
                                            {isImporting ? (
                                                <>
                                                    <Loader2 className="animate-spin w-3 h-3" />
                                                    <span className="truncate max-w-[100px]">{loadingMsg}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <RefreshCw className="w-3 h-3" /> Refresh
                                                </>
                                            )}
                                        </button>
                                        <button onClick={() => setShowImportModal(true)} className="flex-1 md:flex-none bg-white/5 text-gray-400 font-bold px-3 py-2 rounded-lg hover:bg-white/10 flex items-center justify-center gap-2 text-xs">
                                            Update Creds
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => setShowImportModal(true)} className="w-full md:w-auto bg-blue-500 text-white font-bold px-3 py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 text-xs shadow-lg shadow-blue-500/20">
                                        <Download className="w-3 h-3" /> Import from Portal
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Results List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {(() => {
                                const { grouped, sortedKeys } = groupCourses(resultCourses);
                                if (sortedKeys.length === 0) return <div className="col-span-full py-12 text-center text-gray-500">No results imported yet.</div>;

                                // Split into Current (Latest) and Previous
                                const [latestKey, ...previousKeys] = sortedKeys;

                                return (
                                    <div className="col-span-full space-y-8">

                                        {/* Current Semester Section */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                    Current Semester Results
                                                </h2>
                                                <span className="text-[10px] text-orange-400 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20">
                                                    Note: If any subjects have credits that are not counted toward CGPA, exclude those subjects to obtain your actual CGPA.
                                                </span>

                                            </div>
                                            {(() => {
                                                const key = latestKey;
                                                const stats = calculateStats(grouped[key]);
                                                // For latest sem, we usually calc GPA manually as it might not be in the sgpa list yet, 
                                                // or we prioritize the live courses list.
                                                // Using calculated stats.gpa for current/latest semester.

                                                return (
                                                    <div className="glass-card rounded-2xl border border-green-500/30 shadow-[0_0_30px_-5px_rgba(34,197,94,0.2)] overflow-hidden flex flex-col">
                                                        <div className="px-4 py-3 bg-green-500/10 border-b border-green-500/20 flex items-center justify-between">
                                                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                                                {key}
                                                                <span className="bg-green-500 text-black text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold ml-2">Latest</span>
                                                            </h3>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">{stats.credits} Cr</span>
                                                                <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">SGPA {(stats.gpa || 0).toFixed(3)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
                                                            {grouped[key].map((course, i) => (
                                                                <CourseRow key={i} course={course} onRemove={() => removeCourse(false, course)} onUpdate={(field, val) => updateCourse(false, course, field, val)} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* Previous Semesters Section */}
                                        {previousKeys.length > 0 && (
                                            <div className="space-y-4">
                                                <h2 className="text-lg font-bold text-gray-400 flex items-center gap-2 pl-1">
                                                    Previous Semesters
                                                </h2>
                                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                                    {previousKeys.map(key => {
                                                        const stats = calculateStats(grouped[key]);
                                                        const isOpen = openSemesters[key];
                                                        const scrapedSGPA = scrapedSGPAs[key];
                                                        const displayGPA = scrapedSGPA !== undefined ? scrapedSGPA : stats.gpa;

                                                        return (
                                                            <div key={key} className="glass-card rounded-xl border border-white/5 overflow-hidden flex flex-col transition-all duration-300">
                                                                <button
                                                                    onClick={() => setOpenSemesters(prev => ({ ...prev, [key]: !prev[key] }))}
                                                                    className="px-4 py-3 bg-white/5 hover:bg-white/10 flex items-center justify-between w-full transition-colors"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                                                                        <h3 className="text-sm font-bold text-gray-300">{key}</h3>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        {/* Only show credits if open or if we want summary always. Summary always is better. */}
                                                                        <span className="text-[10px] font-bold text-gray-500 bg-black/20 px-2 py-0.5 rounded-full">{stats.credits} Cr</span>
                                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${scrapedSGPA ? 'text-blue-300 bg-blue-500/10 border-blue-500/20' : 'text-gray-400 bg-white/5 border-white/10'}`}>
                                                                            SGPA {(displayGPA || 0).toFixed(3)}
                                                                        </span>
                                                                    </div>
                                                                </button>

                                                                <AnimatePresence>
                                                                    {isOpen && (
                                                                        <motion.div
                                                                            initial={{ height: 0, opacity: 0 }}
                                                                            animate={{ height: "auto", opacity: 1 }}
                                                                            exit={{ height: 0, opacity: 0 }}
                                                                            className="border-t border-white/5"
                                                                        >
                                                                            <div className="p-2 space-y-1 bg-black/20">
                                                                                {grouped[key].map((course, i) => (
                                                                                    <CourseRow key={i} course={course} onRemove={() => removeCourse(false, course)} onUpdate={(field, val) => updateCourse(false, course, field, val)} />
                                                                                ))}
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </motion.div>
                )}

                <div className="h-4" />
            </div>
        </div>
    );
}

// Subcomponent for cleaner rendering
function CourseRow({ course, onRemove, onUpdate }: { course: CourseGrade, onRemove: () => void, onUpdate: (field: keyof CourseGrade, val: any) => void }) {
    const isModified = (course.originalCredit !== undefined && course.credit !== course.originalCredit) ||
        (course.originalGrade !== undefined && course.grade !== course.originalGrade);

    return (
        <div className="group flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
            <div className="flex-1 min-w-0">
                <input type="text" value={course.title} onChange={e => onUpdate("title", e.target.value)} className={`w-full bg-transparent border-none p-0 placeholder-gray-600 focus:ring-0 font-medium text-xs truncate ${isModified ? 'text-orange-300' : 'text-gray-300'}`} placeholder="Course Name" />
            </div>
            <div className="w-8">
                {course.originalCredit !== undefined ? (
                    <select
                        value={course.credit}
                        onChange={e => onUpdate("credit", Number(e.target.value))}
                        className={`w-full bg-black/20 rounded px-0 text-center text-xs font-mono appearance-none cursor-pointer focus:ring-0 border-none py-1 h-6 ${course.credit !== course.originalCredit ? 'text-orange-400 font-bold' : 'text-gray-400'}`}
                        title="Set to 0 to exclude, or use original credit."
                    >
                        <option value={course.originalCredit}>{course.originalCredit}</option>
                        <option value={0}>0</option>
                    </select>
                ) : (
                    <input
                        type="number"
                        min="0"
                        max="20"
                        value={course.credit}
                        onChange={e => onUpdate("credit", Number(e.target.value) || 0)}
                        className={`w-full bg-black/20 rounded px-1 text-center text-xs font-mono focus:text-white text-gray-400`}
                        title="Credits"
                    />
                )}
            </div>
            <div className="w-10">
                <select
                    value={course.grade}
                    onChange={e => onUpdate("grade", e.target.value)}
                    className={`w-full bg-transparent text-xs font-bold text-center focus:ring-0 cursor-pointer appearance-none ${course.originalGrade !== undefined && course.grade !== course.originalGrade
                        ? 'text-orange-400'
                        : (GRADE_COLORS[course.grade] || 'text-white')
                        }`}
                >
                    {Object.keys(GRADE_POINTS).map(g => <option key={g} value={g} className="bg-neutral-900 text-white">{g}</option>)}
                </select>
            </div>
            <button onClick={onRemove} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1" title="Delete Course"><Trash2 className="w-3 h-3" /></button>
        </div>
    );
}
