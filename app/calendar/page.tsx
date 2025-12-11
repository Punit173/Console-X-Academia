"use client";

import { useState, useEffect } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useAppData } from "@/components/AppDataContext";
import { ChevronLeft, ChevronRight, Filter, Reply } from "lucide-react";

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
    // Matches Android Logic: _getSequentialDayOrder
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
        // Android logic iterates from i=1 (tomorrow)

        const diffDays = Math.round((targetStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));

        for (let i = 1; i <= diffDays; i++) {
            const checkDate = new Date(todayStart);
            checkDate.setDate(todayStart.getDate() + i);

            if (!isHoliday(checkDate)) {
                currentOrder = (currentOrder % 5) + 1;
            }
            // If holiday, maintain previous order (pause)
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
        // Add padding for start of week
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

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">Academic Calendar</h1>
                {loading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* CALENDAR GRID */}
                <div className="lg:col-span-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <ChevronLeft className="w-6 h-6 text-white" />
                        </button>
                        <h2 className="text-xl font-bold text-white">
                            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h2>
                        <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <ChevronRight className="w-6 h-6 text-white" />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-2 mb-2 text-center text-sm font-medium text-muted-foreground">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {getMonthDays(currentDate).map((date, idx) => {
                            if (!date) return <div key={idx} />;

                            const events = getEventsForDate(date);
                            const hasEvents = events.length > 0;
                            const isToday = date.toDateString() === new Date().toDateString();
                            const isSelected = selectedDate?.toDateString() === date.toDateString();
                            const dayOrder = getDayOrder(date);

                            return (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedDate(date)}
                                    className={`
                                        relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all
                                        ${isToday ? 'bg-primary text-white shadow-lg shadow-primary/25' : ''}
                                        ${isSelected && !isToday ? 'ring-2 ring-primary ring-offset-2 ring-offset-black' : ''}
                                        ${!isToday && !isSelected ? 'hover:bg-white/5 text-white' : ''}
                                        ${dayOrder ? 'bg-white/5' : ''}
                                    `}
                                >
                                    <span>{date.getDate()}</span>

                                    {/* Dots for Events */}
                                    <div className="flex gap-0.5 mt-1">
                                        {events.slice(0, 3).map((ev: any, i: number) => (
                                            <div key={i} className={`w-1 h-1 rounded-full ${getEventColor(ev.type)}`} />
                                        ))}
                                    </div>

                                    {/* Tiny Day Order Indicator */}
                                    {dayOrder && !hasEvents && (
                                        <div className={`text-[9px] mt-0.5 font-bold ${isToday ? "text-white" : "text-white/30"}`}>DO {dayOrder}</div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* DETAILS PANEL */}
                <div className="lg:col-span-1 space-y-4">
                    {selectedDate ? (
                        <div className="bg-black/80 border border-white/10 rounded-2xl p-6 h-full">
                            <h3 className="text-xl font-bold text-white mb-1">
                                {selectedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}
                            </h3>
                            <p className="text-muted-foreground mb-6">{selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}</p>

                            {/* Sequential Day Order Banner */}
                            {getDayOrder(selectedDate) && (
                                <div className="bg-white text-black p-4 rounded-xl mb-6 flex items-center gap-3">
                                    <Reply className="w-5 h-5 text-black" />
                                    <div>
                                        <div className="text-xs font-bold uppercase tracking-wider opacity-60">Academic Schedule</div>
                                        <div className={`text-lg font-bold ${selectedDate.toDateString() === new Date().toDateString() ? "text-orange-500" : ""}`}>
                                            Day Order {getDayOrder(selectedDate)}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Events List */}
                            <div className="space-y-3">
                                {getEventsForDate(selectedDate).length > 0 ? (
                                    getEventsForDate(selectedDate).map((ev: any, i: number) => (
                                        <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-xl">
                                            <div className={`text-xs font-bold uppercase tracking-wider mb-1 px-2 py-0.5 rounded w-fit text-white ${getEventColor(ev.type)} opacity-80`}>
                                                {ev.type}
                                            </div>
                                            <h4 className="font-bold text-white mt-2">{ev.title}</h4>
                                            {ev.desc && <p className="text-sm text-muted-foreground mt-1">{ev.desc}</p>}
                                        </div>
                                    ))
                                ) : !getDayOrder(selectedDate) && (
                                    <div className="text-center py-10 text-muted-foreground">
                                        <p>No events or classes scheduled.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/5 border border-white/5 border-dashed rounded-2xl p-6 h-full flex items-center justify-center text-center">
                            <p className="text-muted-foreground">Select a date to view details and Day Orders.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
