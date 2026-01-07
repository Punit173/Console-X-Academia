"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/components/AppDataContext";
import { useCalendar } from "@/components/CalendarContext";
import { ArrowLeft, Calendar, Loader2, ArrowRight, TrendingUp, TrendingDown, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface EnrichedCourse {
    title: string;
    category: string;
    slot: string;
    conducted: number;
    absent: number;
    percentage: number;
    [key: string]: any;
}

export default function AttendancePredictPage() {
    const router = useRouter();
    const { data: apiData } = useAppData();
    const { calendarData } = useCalendar();

    const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [enrichedCourses, setEnrichedCourses] = useState<EnrichedCourse[]>([]);
    const [predictions, setPredictions] = useState<any[]>([]);
    const [dayOrdersInRange, setDayOrdersInRange] = useState<number[]>([]);
    const [isCalculating, setIsCalculating] = useState(false);

    // --- 1. Initialization & Course Enrichment ---

    useEffect(() => {
        if (!apiData) {
            router.push("/");
            return;
        }
        enrichCourses();
    }, [apiData]);

    const enrichCourses = () => {
        if (!apiData?.attendance?.attendance?.courses || !apiData?.timetable?.courses) return;

        const attendCourses = apiData.attendance.attendance.courses;
        const timeTableCourses = apiData.timetable.courses;
        const enriched: EnrichedCourse[] = [];

        Object.entries(attendCourses).forEach(([code, val]: [string, any]) => {
            const courseTitle = val.course_title || code;
            const category = val.category || 'Theory';

            // Find matching timetable entry to get SLOT
            const timetableEntry = timeTableCourses.find((tc: any) => {
                if (tc.course_title !== courseTitle) return false;

                const type = tc.course_type || '';
                if (category === 'Theory' && type.includes('Theory')) return true;
                if (category === 'Practical' && type === 'Practical') return true;
                return false;
            });

            if (timetableEntry) {
                enriched.push({
                    title: courseTitle,
                    category: category,
                    slot: timetableEntry.slot || '',
                    conducted: val.total_hours_conducted || 0,
                    absent: val.total_hours_absent || 0,
                    percentage: val.attendance_percentage || 0,
                });
            } else {
                enriched.push({
                    title: courseTitle,
                    category: category,
                    slot: '',
                    conducted: val.total_hours_conducted || 0,
                    absent: val.total_hours_absent || 0,
                    percentage: val.attendance_percentage || 0,
                });
            }
        });

        setEnrichedCourses(enriched);
    };


    // --- 2. Helper Logic (Holidays, Day Orders) ---

    const isHoliday = (date: Date): boolean => {
        const key = `${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}`;
        const dayData = calendarData[key];

        if (dayData && dayData.event) {
            return dayData.event.some((e: any) => e.type === 'holiday');
        }
        return false;
    };

    const getDayOrdersInRange = (start: Date, end: Date): number[] => {
        const orders: number[] = [];
        let current = new Date(start);
        const endDt = new Date(end);

        current.setHours(0, 0, 0, 0);
        endDt.setHours(0, 0, 0, 0);

        let today = new Date();
        today.setHours(0, 0, 0, 0);

        let currentDayOrder = apiData?.attendance?.day_order || 1;

        const nextDayOrder = (ord: number) => (ord % 5) + 1;

        let tracker = new Date(today);
        let orderTracker = currentDayOrder;

        // Move tracker to Start Date
        while (tracker < current) {
            tracker.setDate(tracker.getDate() + 1);
            if (tracker.getDay() !== 0 && tracker.getDay() !== 6 && !isHoliday(tracker)) {
                orderTracker = nextDayOrder(orderTracker);
            }
        }

        while (tracker > current) {
            tracker.setDate(tracker.getDate() - 1);
        }

        // Now collect orders from Start to End
        while (current <= endDt) {
            if (current.getDay() !== 0 && current.getDay() !== 6 && !isHoliday(current)) {
                orders.push(orderTracker);
                orderTracker = nextDayOrder(orderTracker);
            }
            current.setDate(current.getDate() + 1);
        }

        return orders;
    };

    // --- 3. TIMETABLE MATRIX LOGIC ---

    const TIMETABLE_MATRIX: Record<string, any> = {
        "Batch1": {
            "schedule": {
                "Day 1": ["A", "A / X", "F / X", "F", "G", "P6", "P7", "P8", "P9", "P10", "L11", "L12"],
                "Day 2": ["P11", "P12/X", "P13/X", "P14", "P15", "B", "B", "G", "G", "A", "L21", "L22"],
                "Day 3": ["C", "C / X", "A / X", "D", "B", "P26", "P27", "P28", "P29", "P30", "L31", "L32"],
                "Day 4": ["P31", "P32/X", "P33/X", "P34", "P35", "D", "D", "B", "E", "C", "L41", "L42"],
                "Day 5": ["E", "E / X", "C / X", "F", "D", "P46", "P47", "P48", "P49", "P50", "L51", "L52"]
            }
        },
        "Batch2": {
            "schedule": {
                "Day 1": ["P1", "P2/X", "P3/X", "P4", "P5", "A", "A", "F", "F", "G", "L11", "L12"],
                "Day 2": ["B", "B / X", "G / X", "G", "A", "P16", "P17", "P18", "P19", "P20", "L21", "L22"],
                "Day 3": ["P21", "P22/X", "P23/X", "P24", "P25", "C", "C", "A", "D", "B", "L31", "L32"],
                "Day 4": ["D", "D / X", "B / X", "E", "C", "P36", "P37", "P38", "P39", "P40", "L41", "L42"],
                "Day 5": ["P41", "P42/X", "P43/X", "P44", "P45", "E", "E", "C", "F", "D", "L51", "L52"]
            }
        }
    };

    const countClassesPerCourse = (dayOrders: number[]) => {
        const batchStr = apiData?.timetable?.student_info?.batch || "1";
        const batchKey = `Batch${batchStr}`;
        const matrix = TIMETABLE_MATRIX[batchKey] || TIMETABLE_MATRIX["Batch1"];

        const counts: Record<string, number> = {};
        enrichedCourses.forEach(c => counts[c.title + c.slot] = 0);

        dayOrders.forEach(dayOrder => {
            const dayLabel = `Day ${dayOrder}`;
            const daySlots: string[] = matrix.schedule[dayLabel] || [];

            daySlots.forEach((slotCode) => {
                const slotOptions = slotCode.split('/').map(s => s.trim());

                enrichedCourses.forEach(course => {
                    const key = course.title + course.slot;
                    if (!course.slot) return;

                    const courseSlotClean = course.slot.replace(/-+$/, '').trim();
                    let isMatch = false;

                    if (courseSlotClean.includes('-')) {
                        const parts = courseSlotClean.split('-');
                        isMatch = parts.some(p => slotOptions.includes(p.trim()));
                    } else {
                        isMatch = slotOptions.includes(courseSlotClean);
                    }

                    if (isMatch) {
                        counts[key] = (counts[key] || 0) + 1;
                    }
                });
            });
        });

        return counts;
    };

    const calculate = () => {
        if (!startDate || !endDate) return;
        setIsCalculating(true);

        const start = new Date(startDate);
        const end = new Date(endDate);

        const dayOrders = getDayOrdersInRange(start, end);
        setDayOrdersInRange(dayOrders);

        const missedCounts = countClassesPerCourse(dayOrders);

        const preds = enrichedCourses.map(c => {
            const key = c.title + c.slot;
            const missed = missedCounts[key] || 0;

            const newConducted = c.conducted + missed;
            const newAbsent = c.absent + missed;
            const newPresent = c.conducted - c.absent;

            const newPct = newConducted > 0 ? (newPresent / newConducted) * 100 : 0;

            // --- Margin Calculation ---
            const threshold = 75;
            let marginMsg = "";
            let marginType: "safe" | "danger" | "critical" = "safe";
            let marginValue = 0;

            if (newPct >= threshold) {
                const maxTotal = newPresent / (threshold / 100);
                const safeBunks = Math.floor(maxTotal - newConducted);
                marginValue = safeBunks;

                if (safeBunks > 0) {
                    marginMsg = `Safe: ${safeBunks} hrs`;
                    marginType = "safe";
                } else {
                    marginMsg = "Edge";
                    marginType = "critical";
                }
            } else {
                const targetRatio = threshold / 100;
                const needed = Math.ceil((targetRatio * newConducted - newPresent) / (1 - targetRatio));
                marginValue = needed;
                marginMsg = `Need: ${needed} hrs`;
                marginType = "danger";
            }

            return {
                ...c,
                predictedPercentage: newPct,
                percentageDrop: c.percentage - newPct,
                additionalClasses: missed,
                predictedConducted: newConducted,
                predictedAbsent: newAbsent,
                marginMsg,
                marginType,
                marginValue
            };
        });

        preds.sort((a, b) => b.percentageDrop - a.percentageDrop);

        setPredictions(preds);
        setIsCalculating(false);
    };

    // Theme Helpers (Copied from Attendance Page)
    const getAttendanceColor = (percentage: number) => {
        if (percentage >= 80) return "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]";
        if (percentage >= 75) return "text-blue-300 drop-shadow-[0_0_8px_rgba(147,197,253,0.3)]";
        return "text-blue-600";
    };

    const getProgressBarColor = (percentage: number) => {
        if (percentage >= 80) return "bg-white shadow-[0_0_10px_rgba(255,255,255,0.4)]";
        if (percentage >= 75) return "bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.3)]";
        return "bg-blue-800";
    };

    const getAttendanceStatus = (percentage: number) => {
        if (percentage >= 80) return "Excellent";
        if (percentage >= 75) return "Good";
        if (percentage >= 70) return "Average";
        return "Low";
    };


    if (!apiData) return null;

    return (
        <div className="w-full animate-fade-in space-y-8 pb-10 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-blue-900/30 pb-6 relative">
                <Link href="/attendance" className="absolute -top-8 left-0 text-blue-400 hover:text-white flex items-center gap-1 text-sm transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Attendance
                </Link>

                <div className="absolute -left-4 top-0 w-20 h-20 bg-blue-900/20 blur-3xl rounded-full pointer-events-none"></div>
                <div className="relative mt-4">
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2 drop-shadow-sm">
                        Predict <span className="text-blue-200">Attendance</span>
                    </h1>
                    <p className="text-blue-100/70 text-sm font-medium">
                        Select a range to forecast your attendance if you take leave.
                    </p>
                </div>
            </div>

            {/* Input Card */}
            <div className="relative overflow-hidden rounded-2xl border border-blue-900/40 bg-blue-500/10 backdrop-blur-md p-6 shadow-lg shadow-black/40">
                <div className="flex flex-col md:flex-row gap-6 items-end">
                    <div className="flex-1 w-full space-y-2">
                        <label className="text-xs uppercase text-blue-300 font-bold ml-1 flex items-center gap-2">
                            <Calendar className="w-3 h-3" /> Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full bg-slate-950/50 border border-blue-800/30 rounded-xl p-3 text-white focus:border-blue-400 focus:bg-blue-950/30 outline-none transition-all"
                        />
                    </div>
                    <div className="flex-1 w-full space-y-2">
                        <label className="text-xs uppercase text-blue-300 font-bold ml-1 flex items-center gap-2">
                            <Calendar className="w-3 h-3" /> End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full bg-slate-950/50 border border-blue-800/30 rounded-xl p-3 text-white focus:border-blue-400 focus:bg-blue-950/30 outline-none transition-all"
                        />
                    </div>

                    <button
                        onClick={calculate}
                        disabled={!startDate || !endDate || isCalculating}
                        className="w-full md:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                    >
                        {isCalculating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Predict"}
                    </button>
                </div>
            </div>

            {/* Results */}
            {predictions.length > 0 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between pb-2">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.6)]"></span>
                            Prediction Results
                        </h3>
                        <span className="text-sm text-blue-300/70 bg-blue-950/40 px-3 py-1 rounded-full border border-blue-900/30">
                            {dayOrdersInRange.length} Working Days
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {predictions.map((p, i) => (
                            <div
                                key={i}
                                className="relative rounded-xl p-6 border border-blue-900/30 bg-slate-950/60 hover:bg-blue-950/30 hover:border-blue-500/40 transition-all duration-300 flex flex-col justify-between gap-6 group overflow-hidden h-full min-h-[180px]"
                                style={{ animationDelay: `${i * 50}ms` }}
                            >
                                {/* Subtle Glow */}
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                <div className="flex-1 min-w-0 relative z-10">
                                    {/* Header Badge Row */}
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-mono font-bold text-blue-200 bg-blue-950/80 border border-blue-800 px-2 py-0.5 rounded shadow-sm opacity-70">
                                            {p.slot || 'N/A'}
                                        </span>

                                        {/* Margin Badge */}
                                        <div className={`text-[10px] font-bold px-2 py-1 rounded-full border flex items-center gap-1 ${p.marginType === 'safe' ? 'bg-blue-900/30 border-blue-500/30 text-blue-300' :
                                            p.marginType === 'danger' ? 'bg-red-900/30 border-red-500/30 text-red-300' :
                                                'bg-yellow-900/30 border-yellow-500/30 text-yellow-300'
                                            }`}>
                                            {p.marginType === 'safe' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                            {p.marginMsg}
                                        </div>
                                    </div>

                                    <h4 className="font-bold text-white text-lg leading-tight group-hover:text-blue-100 transition-colors">
                                        {p.title}
                                    </h4>

                                    <div className="mt-4 pt-4 border-t border-white/5 space-y-1">
                                        <div className="text-xs text-gray-400 flex justify-between">
                                            <span>Current:</span>
                                            <span className="font-mono text-white">{p.percentage.toFixed(1)}%</span>
                                        </div>

                                        {p.additionalClasses > 0 ? (
                                            <div className="text-xs text-orange-300 flex items-center gap-1.5 mt-2 bg-orange-950/20 p-1.5 rounded-lg border border-orange-900/30">
                                                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                                                <span>Miss <strong>{p.additionalClasses}</strong> classes ({p.predictedConducted} total)</span>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-green-300 flex items-center gap-1.5 mt-2 bg-green-950/20 p-1.5 rounded-lg border border-green-900/30">
                                                <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                                <span>No classes scheduled</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Prediction Big Number */}
                                <div className="flex-shrink-0 w-full flex flex-col items-end relative z-10">
                                    <div className="flex items-baseline gap-1 mb-2">
                                        <span className={`text-3xl font-bold ${getAttendanceColor(p.predictedPercentage)}`}>
                                            {p.predictedPercentage.toFixed(1)}%
                                        </span>
                                        <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider">Predicted</span>
                                    </div>
                                    <div className="w-full bg-blue-950 rounded-full h-1.5 overflow-hidden shadow-inner border border-white/5">
                                        <div
                                            className={`h-full ${getProgressBarColor(p.predictedPercentage)} transition-all duration-1000`}
                                            style={{ width: `${Math.min(p.predictedPercentage, 100)}%` }}
                                        />
                                    </div>

                                    {p.percentageDrop > 0.1 && (
                                        <p className="text-[10px] text-red-400 mt-1 font-mono">
                                            ▼ Drops by {p.percentageDrop.toFixed(1)}%
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
