"use client";

import { useState, useEffect } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useAppData } from "@/components/AppDataContext";
import { ChevronLeft, ChevronRight, Clock, MapPin, Calendar as CalendarIcon, Info } from "lucide-react";

// --- BATCH DATA (Kept identical to your source) ---
const BATCH_TIMETABLES: any = {
  "1": {
    time_slots: [
      "08:00 - 08:50", "08:50 - 09:40", "09:45 - 10:35", "10:40 - 11:30",
      "11:35 - 12:25", "12:30 - 01:20", "01:25 - 02:15", "02:20 - 03:10",
      "03:10 - 04:00", "04:00 - 04:50", "04:50 - 05:30", "05:30 - 06:10"
    ],
    schedule: {
      "1": ["A", "A / X", "F / X", "F", "G", "P6", "P7", "P8", "P9", "P10", "L11", "L12"],
      "2": ["P11", "P12/X", "P13/X", "P14", "P15", "B", "B", "G", "G", "A", "L21", "L22"],
      "3": ["C", "C / X", "A / X", "D", "B", "P26", "P27", "P28", "P29", "P30", "L31", "L32"],
      "4": ["P31", "P 32/X", "P33/X", "P34", "P35", "D", "D", "B", "E", "C", "L41", "L42"],
      "5": ["E", "E / X", "C / X", "F", "D", "P46", "P47", "P48", "P49", "P50", "L51", "L52"]
    }
  },
  "2": {
    time_slots: [
      "08:00 - 08:50", "08:50 - 09:40", "09:45 - 10:35", "10:40 - 11:30",
      "11:35 - 12:25", "12:30 - 01:20", "01:25 - 02:15", "02:20 - 03:10",
      "03:10 - 04:00", "04:00 - 04:50", "04:50 - 05:30", "05:30 - 06:10"
    ],
    schedule: {
      "1": ["P1", "P2/X", "P3/X", "P4", "P5", "A", "A", "F", "F", "G", "L11", "L12"],
      "2": ["B", "B / X", "G / X", "G", "A", "P16", "P17", "P18", "P19", "P20", "L21", "L22"],
      "3": ["P21", "P22/X", "P23/X", "P24", "P25", "C", "C", "A", "D", "B", "L31", "L32"],
      "4": ["D", "D / X", "B / X", "E", "C", "P36", "P37", "P38", "P39", "P40", "L41", "L42"],
      "5": ["P41", "P42/X", "P43/X", "P44", "P45", "E", "E", "C", "F", "D", "L51", "L52"]
    }
  }
};

export default function CalendarPage() {
    const { data } = useAppData();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [eventsMap, setEventsMap] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Initial Day Order from Login Data
    const initialDayOrder = data?.attendance?.day_order
        ? (typeof data.attendance.day_order === 'string' ? parseInt(data.attendance.day_order) : data.attendance.day_order)
        : null;

    useEffect(() => {
        const fetchCalendar = async () => {
            try {
                const db = getFirestore(app);
                const snapshot = await getDocs(collection(db, "calendar"));
                const events: Record<string, any> = {};

                snapshot.forEach(doc => {
                    events[doc.id] = doc.data();
                });

                setEventsMap(events);
            } catch (error) {
                console.error("Error fetching calendar:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCalendar();
    }, []);

    // --- LOGIC: Compute Sequential Day Order ---
    const getDayOrder = (targetDate: Date) => {
        const today = new Date();
        const normalize = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

        const todayStart = normalize(today);
        const targetStart = normalize(targetDate);

        if (targetStart < todayStart || initialDayOrder === null) return null;
        if (isHoliday(targetStart)) return null;

        if (targetStart.getTime() === todayStart.getTime()) {
            return initialDayOrder;
        }

        let currentOrder = initialDayOrder;
        // Count days from TOMORROW until TARGET
        const diffDays = Math.round((targetStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));

        for (let i = 1; i <= diffDays; i++) {
            const checkDate = new Date(todayStart);
            checkDate.setDate(todayStart.getDate() + i);

            if (!isHoliday(checkDate)) {
                currentOrder = (currentOrder % 5) + 1;
            }
        }

        return currentOrder;
    };

    const isHoliday = (date: Date) => {
        const key = `${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}`;
        const dayData = eventsMap[key];
        if (!dayData?.event) return false;
        return dayData.event.some((e: any) => e.type === 'holiday');
    };

    const getEventsForDate = (date: Date) => {
        const key = `${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}`;
        return eventsMap[key]?.event || [];
    };

    // --- UI HELPERS ---
    const getMonthDays = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days = [];
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }

        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

    const getEventColor = (type: string) => {
        switch (type) {
            case 'holiday': return 'bg-red-500';
            case 'admin': return 'bg-orange-500';
            case 'event': return 'bg-blue-500';
            default: return 'bg-gray-500';
        }
    };

    const getClassesForDayOrder = (dayOrder: number | null) => {
        if (!dayOrder || !data) return [];

        const studentBatch = data.timetable?.student_info?.batch || "1";
        const batchData = BATCH_TIMETABLES[`${studentBatch}`] || BATCH_TIMETABLES["1"];
        const daySlots = batchData.schedule[`${dayOrder}`] || [];
        const courses = data.timetable?.courses || [];

        const results: any[] = [];

        daySlots.forEach((slotCode: string, index: number) => {
            if (index >= batchData.time_slots.length) return;

            const timeSlot = batchData.time_slots[index];
            const slotOptions = slotCode.split('/').map((s: string) => s.trim());

            const course = courses.find((c: any) => {
                const rawSlot = (c.slot || "").replace(/-+$/, '').trim();
                if (rawSlot.includes('-')) {
                    const parts = rawSlot.split('-').map((p: string) => p.trim());
                    return parts.some((p: string) => slotOptions.includes(p));
                }
                return slotOptions.includes(rawSlot);
            });

            if (course) {
                results.push({
                    time: timeSlot,
                    code: course.course_code,
                    title: course.course_title,
                    venue: course.room_no || "TBA",
                    slotCode: slotCode,
                    faculty: course.faculty_name
                });
            }
        });

        return results;
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <header className="flex items-center justify-between pb-4 border-b border-white/10">
                <h1 className="text-3xl font-bold text-white tracking-tight">Academic Calendar</h1>
                {loading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* --- LEFT COLUMN: CALENDAR GRID --- */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 lg:p-8 shadow-2xl">
                        {/* Month Navigation */}
                        <div className="flex items-center justify-between mb-8">
                            <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors border border-white/5 hover:border-white/20">
                                <ChevronLeft className="w-5 h-5 text-white" />
                            </button>
                            <h2 className="text-2xl font-bold text-white tracking-wide">
                                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </h2>
                            <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors border border-white/5 hover:border-white/20">
                                <ChevronRight className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        {/* Weekday Headers */}
                        <div className="grid grid-cols-7 gap-3 mb-4">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                <div key={i} className="text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">{d}</div>
                            ))}
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 gap-3">
                            {getMonthDays(currentDate).map((date, idx) => {
                                if (!date) return <div key={idx} />;

                                const events = getEventsForDate(date);
                                const hasEvents = events.length > 0;
                                const isToday = date.toDateString() === new Date().toDateString();
                                const isSelected = selectedDate?.toDateString() === date.toDateString();
                                const dayOrder = getDayOrder(date);

                                // Base Styles
                                const baseClasses = "relative aspect-square rounded-2xl flex flex-col items-center justify-center text-sm font-medium transition-all duration-200 group";
                                
                                // State Styles
                                let stateClasses = "hover:bg-white/5 text-gray-300";
                                if (isToday) stateClasses = "bg-primary text-white shadow-lg shadow-primary/25 border border-primary/50";
                                else if (isSelected) stateClasses = "bg-white/10 text-white ring-2 ring-primary ring-offset-2 ring-offset-black";
                                else if (hasEvents) stateClasses = "bg-white/5 border border-white/20 hover:border-white/40 text-white";
                                else if (dayOrder) stateClasses = "bg-blue-500/10 border border-blue-500/10 hover:border-blue-500/30 text-blue-100";

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedDate(date)}
                                        className={`${baseClasses} ${stateClasses}`}
                                    >
                                        <span className="z-10 relative">{date.getDate()}</span>

                                        {/* Event Dots */}
                                        <div className="flex gap-0.5 mt-1.5 min-h-[6px]">
                                            {events.slice(0, 3).map((ev: any, i: number) => (
                                                <div key={i} className={`w-1.5 h-1.5 rounded-full ring-1 ring-black ${getEventColor(ev.type)}`} />
                                            ))}
                                        </div>

                                        {/* Day Order Label (Subtle) */}
                                        {dayOrder && !hasEvents && (
                                            <div className={`absolute bottom-1.5 text-[9px] font-bold opacity-70 ${isToday ? 'text-white' : 'text-blue-300'}`}>
                                                DO{dayOrder}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* --- LEGEND SECTION (New) --- */}
                    <div className="flex flex-wrap justify-center gap-4 lg:gap-8 p-4 bg-white/5 border border-white/5 rounded-2xl">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/50"></span>
                            <span className="text-sm text-gray-400">Holiday</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50"></span>
                            <span className="text-sm text-gray-400">Admin</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></span>
                            <span className="text-sm text-gray-400">Event</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500/50"></span>
                            <span className="text-sm text-gray-400">Academic Day</span>
                        </div>
                         <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-primary border border-primary/50"></span>
                            <span className="text-sm text-gray-400">Today</span>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN: DETAILS PANEL --- */}
                <div className="lg:col-span-5 h-full">
                    {selectedDate ? (
                        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 lg:p-8 h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* Header */}
                            <div className="mb-6">
                                <h3 className="text-3xl font-bold text-white mb-1">
                                    {selectedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}
                                </h3>
                                <p className="text-muted-foreground font-medium text-lg">
                                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                                </p>
                            </div>

                            {/* Day Order Banner */}
                            {getDayOrder(selectedDate) && (
                                <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-5 rounded-2xl mb-6 shadow-xl shadow-blue-900/20 border border-blue-400/20">
                                    <div className="flex items-center gap-3 mb-1">
                                        <CalendarIcon className="w-5 h-5 opacity-80" />
                                        <span className="text-xs font-bold uppercase tracking-wider opacity-80">Academic Schedule</span>
                                    </div>
                                    <div className="text-2xl font-bold">
                                        Day Order {getDayOrder(selectedDate)}
                                    </div>
                                    {selectedDate.toDateString() === new Date().toDateString() && (
                                        <div className="mt-2 inline-block px-2 py-0.5 bg-white/20 rounded text-xs font-semibold">Today's Schedule</div>
                                    )}
                                </div>
                            )}

                            {/* Scrollable Content Area */}
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                                {/* Section: Events/Holidays */}
                                {getEventsForDate(selectedDate).length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Notices</h4>
                                        {getEventsForDate(selectedDate).map((ev: any, i: number) => (
                                            <div key={i} className={`
                                                p-4 rounded-xl border backdrop-blur-md
                                                ${ev.type === 'holiday' ? 'bg-red-500/10 border-red-500/20' : ''}
                                                ${ev.type === 'admin' ? 'bg-orange-500/10 border-orange-500/20' : ''}
                                                ${ev.type === 'event' ? 'bg-blue-500/10 border-blue-500/20' : ''}
                                                ${!['holiday', 'admin', 'event'].includes(ev.type) ? 'bg-white/5 border-white/10' : ''}
                                            `}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md text-white
                                                        ${ev.type === 'holiday' ? 'bg-red-500' : ''}
                                                        ${ev.type === 'admin' ? 'bg-orange-500' : ''}
                                                        ${ev.type === 'event' ? 'bg-blue-500' : ''}
                                                        ${!['holiday', 'admin', 'event'].includes(ev.type) ? 'bg-gray-600' : ''}
                                                    `}>
                                                        {ev.type}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-white text-lg leading-tight">{ev.title}</h4>
                                                {ev.desc && <p className="text-sm text-gray-400 mt-2 leading-relaxed">{ev.desc}</p>}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Section: Classes */}
                                {getDayOrder(selectedDate) && (
                                    <div className="space-y-3">
                                        {getClassesForDayOrder(getDayOrder(selectedDate)).length > 0 ? (
                                            <>
                                                {getEventsForDate(selectedDate).length > 0 && <div className="h-px bg-white/10 my-4" />}
                                                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider sticky top-0 bg-black/0 backdrop-blur-md py-2 z-10">Classes</h4>
                                                
                                                <div className="space-y-3">
                                                    {getClassesForDayOrder(getDayOrder(selectedDate)).map((cls: any, idx: number) => (
                                                        <div key={idx} className="group flex flex-col gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-xl transition-all">
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex items-center gap-2 text-xs font-mono text-blue-300 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/10">
                                                                    <Clock className="w-3 h-3" />
                                                                    {cls.time}
                                                                </div>
                                                                <span className="text-[10px] font-bold text-white/40 bg-white/5 px-1.5 py-0.5 rounded">{cls.code}</span>
                                                            </div>
                                                            
                                                            <div>
                                                                <h4 className="font-bold text-white text-base">{cls.title}</h4>
                                                                <p className="text-sm text-gray-400">{cls.faculty?.split('(')[0]}</p>
                                                            </div>

                                                            <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 group-hover:text-blue-300 transition-colors">
                                                                <MapPin className="w-3.5 h-3.5" />
                                                                {cls.venue}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            !getEventsForDate(selectedDate).length && (
                                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                                    <Info className="w-8 h-8 mb-2 opacity-50" />
                                                    <p>No classes scheduled for this day.</p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // Empty State (No Date Selected)
                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white/5 border border-white/5 border-dashed rounded-3xl">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                <CalendarIcon className="w-8 h-8 text-white/40" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">No Date Selected</h3>
                            <p className="text-muted-foreground max-w-xs">Select a date from the calendar to view the academic schedule, events, and notices.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}