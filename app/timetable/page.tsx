"use client";

import { useAppData } from "@/components/AppDataContext";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  MapPin,
  Calendar,
  BookOpen,
  Coffee,
  ChevronRight
} from "lucide-react";

// --- 1. HARDCODED BATCH DATA (Translated from Dart) ---
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
      "4": ["P31", "P32/X", "P33/X", "P34", "P35", "D", "D", "B", "E", "C", "L41", "L42"],
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

import { useRouter } from "next/navigation";

export default function TimetablePage() {
  const router = useRouter();
  const { data } = useAppData();

  useEffect(() => {
    if (!data) {
      router.push("/");
    }
  }, [data, router]);


  // State for selected tab (Day 1-5)
  const [selectedDay, setSelectedDay] = useState<number>(1);

  // --- 2. LOGIC EXTRACTION (Mimicking TimetableService) ---
  const timetableLogic = useMemo(() => {
    if (!data) return null;

    const currentDayOrder = data.attendance?.day_order || 0;
    const studentBatch = data.timetable?.student_info?.batch || "1";
    const batchData = BATCH_TIMETABLES[`${studentBatch}`] || BATCH_TIMETABLES["1"];
    const courses = data.timetable?.courses || [];

    // Helper: Match Slot to Course
    const getCourseForSlot = (slotCode: string) => {
      const slotOptions = slotCode.split('/').map(s => s.trim());

      for (const course of courses) {
        // Clean trailing hyphens (e.g., "A-" -> "A")
        const rawSlot = (course.slot || "").replace(/-+$/, '').trim();

        let match = false;

        // Handle ranges like "L41-L42"
        if (rawSlot.includes('-')) {
          const parts = rawSlot.split('-').map((p: string) => p.trim());
          match = parts.some((p: string) => slotOptions.includes(p));
        } else {
          match = slotOptions.includes(rawSlot);
        }

        if (match) {
          return {
            found: true,
            title: course.course_title,
            code: course.course_code,
            venue: course.room_no || "TBA",
            type: course.course_type,
            faculty: course.faculty_name
          };
        }
      }
      return { found: false };
    };

    // Helper: Get classes for a specific day
    const getClassesForDay = (day: number) => {
      const dayKey = `${day}`; // "1", "2"...
      const daySlots = batchData.schedule[dayKey];
      if (!daySlots) return [];

      const results: any[] = [];

      daySlots.forEach((slotCode: string, index: number) => {
        // Stop if we exceed defined time slots
        if (index >= batchData.time_slots.length) return;

        const timeSlot = batchData.time_slots[index];
        const courseInfo = getCourseForSlot(slotCode);

        // Calculate visual status
        const now = new Date();

        if (courseInfo.found) {
          results.push({
            time: timeSlot,
            slotCode: slotCode,
            ...courseInfo
          });
        }
      });

      return results;
    };

    return {
      currentDayOrder,
      studentBatch,
      getClassesForDay
    };
  }, [data]);

  // Set initial tab to current day order on load
  useEffect(() => {
    if (timetableLogic?.currentDayOrder && timetableLogic.currentDayOrder >= 1 && timetableLogic.currentDayOrder <= 5) {
      setSelectedDay(timetableLogic.currentDayOrder);
    }
  }, [timetableLogic]);

  if (!data || !timetableLogic) {
    return <div className="p-8 text-center text-pink-400 animate-pulse">Loading Timetable...</div>;
  }

  const classes = timetableLogic.getClassesForDay(selectedDay);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in p-1">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-pink-500/10 relative">
        <div className="absolute -left-4 top-0 w-20 h-20 bg-pink-500/10 blur-3xl rounded-full pointer-events-none"></div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-pink-500" />
            Timetable
          </h1>
          <p className="text-pink-200/50 text-sm">
            Batch {timetableLogic.studentBatch} • Day Order System
          </p>
        </div>

        <div className="glass-card px-4 py-2 rounded-lg border border-pink-500/30 bg-pink-950/30 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse shadow-[0_0_8px_rgba(236,72,153,0.6)]" />
          <span className="text-pink-400 font-mono font-bold">
            Today is Day Order {timetableLogic.currentDayOrder}
          </span>
        </div>
      </div>

      {/* Day Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar">
        {[1, 2, 3, 4, 5].map((day) => {
          const isCurrent = day === timetableLogic.currentDayOrder;
          const isSelected = day === selectedDay;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`
                relative flex-shrink-0 px-6 py-3 rounded-xl font-medium transition-all duration-300
                ${isSelected
                  ? "bg-pink-600 text-white shadow-lg shadow-pink-500/20 scale-105"
                  : "border border-pink-500/10 hover:bg-pink-900/30 hover:text-pink-200 hover:border-pink-500/30"
                }
              `}
            >
              <div className="flex flex-col items-center gap-1">
                <span className={`text-xs uppercase tracking-widest ${isSelected ? 'text-pink-100' : 'text-pink-400/50'}`}>Day Order</span>
                <span className="text-xl font-bold">{day}</span>
              </div>

              {isCurrent && !isSelected && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full shadow-[0_0_5px_rgba(236,72,153,0.8)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Timeline Content */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDay}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {classes.length === 0 ? (
              // Empty State
              <div className="flex flex-col items-center justify-center py-20 text-pink-300/50 glass-card rounded-2xl border border-pink-500/10 bg-pink-950/10">
                <Coffee className="w-12 h-12 mb-4 opacity-50 text-pink-400" />
                <p>No classes scheduled for Day Order {selectedDay}</p>
              </div>
            ) : (
              // Class List
              classes.map((item: any, idx: number) => (
                <div key={idx} className="group relative flex gap-6">

                  {/* Timeline Spine */}
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-pink-900/40 border border-pink-500/30 group-hover:bg-pink-500 group-hover:border-pink-400 group-hover:ring-4 group-hover:ring-pink-500/20 transition-all z-10 mt-6" />
                    {idx !== classes.length - 1 && (
                      <div className="w-0.5 h-full bg-pink-500/10 group-hover:bg-pink-500/30 transition-colors -mb-6" />
                    )}
                  </div>

                  {/* Card */}
                  <div className="flex-1 glass-card p-5 rounded-2xl border-l-4 border-l-transparent border border-pink-500/5 bg-pink-950/10 hover:border-l-pink-500 hover:bg-pink-900/20 transition-all mb-2">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-mono text-pink-300 bg-pink-500/10 border border-pink-500/20 px-2 py-1 rounded w-fit mb-2">
                          <Clock className="w-3 h-3" />
                          {item.time}
                        </div>
                        <h3 className="text-lg font-bold text-white group-hover:text-pink-300 transition-colors">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-pink-200/60">
                          <span className="bg-pink-500/10 px-1.5 rounded text-xs text-pink-300">{item.code}</span>
                          <span>•</span>
                          <span className="text-xs">{item.faculty?.split('(')[0]}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 mt-2 md:mt-0">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-500/5 border border-pink-500/10 text-xs font-medium text-pink-100">
                          <MapPin className="w-3 h-3 text-pink-500" />
                          {item.venue}
                        </div>
                        <div className="text-[10px] text-pink-300/40 font-mono">
                          Slot: {item.slotCode}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}