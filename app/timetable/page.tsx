"use client";

import { useAppData } from "@/components/AppDataContext";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import {
  Clock,
  MapPin,
  Calendar,
  BookOpen,
  Coffee,
  ChevronRight,
  Download
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
  // --- Modern Pastel Palette for Creative Look ---
  const TAG_COLORS = [
    { bg: "#FCE7F3", text: "#9D174D", border: "#FBCFE8" }, // Pink
    { bg: "#E0E7FF", text: "#3730A3", border: "#C7D2FE" }, // Indigo
    { bg: "#D1FAE5", text: "#065F46", border: "#A7F3D0" }, // Emerald
    { bg: "#FEF3C7", text: "#92400E", border: "#FDE68A" }, // Amber
    { bg: "#FAE8FF", text: "#86198F", border: "#F5D0FE" }, // Fuchsia
    { bg: "#E0F2FE", text: "#075985", border: "#BAE6FD" }, // Sky
    { bg: "#FFE4E6", text: "#9F1239", border: "#FECDD3" }, // Rose
    { bg: "#F3F4F6", text: "#1F2937", border: "#E5E7EB" }, // Gray
    { bg: "#CCFBF1", text: "#115E59", border: "#99F6E4" }, // Teal
    { bg: "#EDE9FE", text: "#5B21B6", border: "#DDD6FE" }, // Violet
    { bg: "#FFEDD5", text: "#9A3412", border: "#FED7AA" }, // Orange
    { bg: "#ECFCCB", text: "#3F6212", border: "#D9F99D" }, // Lime
  ];

  const router = useRouter();
  const { data } = useAppData();
  const hiddenTableRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!data) {
      router.push("/");
    }
  }, [data, router]);

  // Handle auto-scaling when preview opens
  useEffect(() => {
    if (showPreview && scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.clientWidth - 64; // - padding
      const tableWidth = 1600;
      const newScale = Math.min(1, containerWidth / tableWidth);
      setScale(newScale);
    }
  }, [showPreview]);

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

    // Helper: Get Full Schedule for Image Generation
    const getFullSchedule = () => {
      const allDays = [1, 2, 3, 4, 5];
      const data = allDays.map(day => {
        const daySlots = batchData.schedule[`${day}`] || [];
        return {
          dayOrder: day,
          slots: daySlots.map((slotCode: string, index: number) => {
            if (index >= batchData.time_slots.length) return null;
            return getCourseForSlot(slotCode);
          })
        };
      });
      return {
        timeSlots: batchData.time_slots,
        days: data
      };
    };

    // Generate Color Map for Subjects (Pastel Object)
    const subjectColors: Record<string, typeof TAG_COLORS[0]> = {};
    let colorIndex = 0;
    courses.forEach((c: any) => {
      if (!subjectColors[c.course_code]) {
        subjectColors[c.course_code] = TAG_COLORS[colorIndex % TAG_COLORS.length];
        colorIndex++;
      }
    });

    return {
      currentDayOrder,
      studentBatch,
      getClassesForDay,
      getFullSchedule,
      subjectColors
    };
  }, [data]);

  // Set initial tab to current day order on load
  useEffect(() => {
    if (timetableLogic?.currentDayOrder && timetableLogic.currentDayOrder >= 1 && timetableLogic.currentDayOrder <= 5) {
      setSelectedDay(timetableLogic.currentDayOrder);
    }
  }, [timetableLogic]);

  const handleDownloadImage = async () => {
    if (!hiddenTableRef.current || !data) return;

    setIsDownloading(true);
    try {
      // 1. CLONE THE ELEMENT
      // We clone the node to isolate it from the modal's scaling context.
      const originalElement = hiddenTableRef.current;
      const clone = originalElement.cloneNode(true) as HTMLElement;

      // 2. STYLE THE CLONE
      // Position it off-screen but in the DOM so it renders correctly
      clone.style.position = "fixed";
      clone.style.top = "0";
      clone.style.left = "0";
      clone.style.zIndex = "-9999";
      clone.style.transform = "none"; // Ensure no scaling
      clone.style.width = "1600px"; // Enforce fixed width
      clone.style.height = "auto";
      clone.style.overflow = "visible";

      // Append to body
      document.body.appendChild(clone);

      // 3. CAPTURE THE CLONE
      const canvas = await html2canvas(clone, {
        scale: 2, // High resolution
        backgroundColor: "#F8FAFC", // Match background
        logging: false,
        useCORS: true,
        windowWidth: 1920, // Pretend we have space
        windowHeight: 1080
      });

      // 4. CLEANUP
      document.body.removeChild(clone);

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");

      const sectionName = data.timetable?.student_info?.batch || "Timetable";
      const kv = sectionName.replace(/\s+/g, '_');

      link.href = image;
      link.download = `${kv}_schedule.png`;
      link.click();

    } catch (error) {
      console.error("Failed to generate image", error);
      alert("Failed to generate image. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!data || !timetableLogic) {
    return <div className="p-8 text-center text-pink-400 animate-pulse">Loading Timetable...</div>;
  }

  const classes = timetableLogic.getClassesForDay(selectedDay);
  const fullSchedule = timetableLogic.getFullSchedule();

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

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(true)}
            className="glass-card px-4 py-2 rounded-lg border border-pink-500/30 bg-pink-950/30 flex items-center gap-2 hover:bg-pink-900/40 transition-colors"
          >
            <Download className="w-4 h-4 text-pink-400" />
            <span className="text-pink-400 font-medium text-sm">Download</span>
          </button>
          <div className="glass-card px-4 py-2 rounded-lg border border-pink-500/30 bg-pink-950/30 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse shadow-[0_0_8px_rgba(236,72,153,0.6)]" />
            <span className="text-pink-400 font-mono font-bold">
              Today is Day Order {timetableLogic.currentDayOrder}
            </span>
          </div>
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
                relative shrink-0 px-6 py-3 rounded-xl font-medium transition-all duration-300
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

      {/* --- PREVIEW MODAL (The Creative One) --- */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowPreview(false)
            }}
          >
            <div className="w-full max-w-[95vw] h-[90vh] flex flex-col">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full"
              >
                {/* Modal Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-900 shrink-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">Preview</h2>
                    {/* Zoom Controls */}
                    <div className="flex items-center gap-1 ml-4 bg-zinc-800 rounded-lg p-1 border border-white/5">
                      <button
                        onClick={() => setScale(s => Math.max(0.2, s - 0.1))}
                        className="p-1 hover:bg-zinc-700 rounded text-gray-400 hover:text-white"
                        title="Zoom Out"
                      >
                        <div className="w-4 h-4 flex items-center justify-center font-bold text-lg leading-none">-</div>
                      </button>
                      <span className="text-xs text-gray-500 w-12 text-center font-mono">{Math.round(scale * 100)}%</span>
                      <button
                        onClick={() => setScale(s => Math.min(2, s + 0.1))}
                        className="p-1 hover:bg-zinc-700 rounded text-gray-400 hover:text-white"
                        title="Zoom In"
                      >
                        <div className="w-4 h-4 flex items-center justify-center font-bold text-lg leading-none">+</div>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowPreview(false)}
                      className="text-gray-400 hover:text-white text-sm"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleDownloadImage}
                      disabled={isDownloading}
                      className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                      {isDownloading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
                      Download Image
                    </button>
                  </div>
                </div>

                {/* Scrollable Content Area */}
                <div
                  ref={scrollContainerRef}
                  className="flex-1 overflow-auto bg-zinc-950 p-8 custom-scrollbar relative flex items-start justify-center"
                >
                  {/* This is the Actual Content to Capture - Light Theme */}
                  {/* Wrapper for Scaling */}
                  <div
                    style={{
                      transform: `scale(${scale})`,
                      transformOrigin: 'top center',
                      transition: 'transform 0.2s ease-out'
                    }}
                  >

                    {/* --- GENERATED TABLE START --- */}
                    <div
                      id="hidden-full-table"
                      ref={hiddenTableRef}
                      style={{
                        width: "1600px",
                        padding: "60px",
                        background: "#F8FAFC", // Slate-50: Premium Light Gray Background
                        color: "#1E293B", // Slate-800
                        fontFamily: "'Inter', system-ui, sans-serif",
                        position: 'relative'
                      }}
                    >
                      {/* Background Pattern */}
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: "12px", background: "linear-gradient(to right, #EC4899, #8B5CF6)" }}></div>

                      {/* Header Section */}
                      <div style={{ marginBottom: "40px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                        <div>
                          <h1 style={{ fontSize: "48px", fontWeight: "800", color: "#0F172A", marginBottom: "8px", letterSpacing: "-0.02em" }}>Weekly Schedule</h1>
                          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                            <p style={{ fontSize: "20px", fontWeight: "500", color: "#64748B" }}>Batch {timetableLogic.studentBatch}</p>
                            <span style={{ height: "6px", width: "6px", background: "#CBD5E1", borderRadius: "50%" }}></span>
                            <p style={{ fontSize: "20px", fontWeight: "600", color: "#475569" }}>{data?.timetable?.student_info?.name}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ textAlign: "right" }}>
                            <p style={{ fontSize: "14px", fontWeight: "600", color: "#94A3B8", textTransform: 'uppercase', letterSpacing: '0.05em' }}>Powered by</p>
                            <p style={{ fontSize: "18px", fontWeight: "bold", color: "#334155" }}>Console X Academia</p>
                          </div>
                          {/* Logo moved to grid corner */}
                        </div>
                      </div>

                      {/* New Creative Grid Layout (No Borders, Just Gaps) */}
                      <div style={{ display: "grid", gridTemplateColumns: "100px repeat(12, 1fr)", gap: "12px" }}>

                        {/* Time Header Row */}
                        <div style={{ padding: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <img
                            src="/assets/logo.jpg"
                            alt="Logo"
                            style={{
                              width: "60px",
                              height: "60px",
                              objectFit: "contain",
                              borderRadius: "8px",
                              mixBlendMode: "multiply" // Blend with background
                            }}
                          />
                        </div>
                        {fullSchedule.timeSlots.map((slot: string, i: number) => (
                          <div key={i} style={{
                            padding: "0 4px", fontSize: "12px", fontFamily: "monospace", color: "#64748B",
                            textAlign: "center", display: "flex", alignItems: "end", justifyContent: "center",
                            fontWeight: "600", height: "40px", borderBottom: "2px solid #E2E8F0", paddingBottom: "8px"
                          }}>
                            {slot}
                          </div>
                        ))}

                        {/* Days & Classes */}
                        {fullSchedule.days.map((dayData: any) => (
                          <React.Fragment key={dayData.dayOrder}>
                            {/* Day Label */}
                            <div style={{
                              display: "flex", alignItems: "center", justifyContent: "center",
                              background: "#FFFFFF", borderRadius: "12px",
                              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                              color: "#334155", fontWeight: "bold", fontSize: "18px"
                            }}>
                              Day {dayData.dayOrder}
                            </div>

                            {/* Slots */}
                            {dayData.slots.map((slotData: any, i: number) => {
                              const colors = slotData && slotData.code ? timetableLogic.subjectColors[slotData.code] : null;

                              // Creative Card Style
                              if (slotData && slotData.found && colors) {
                                return (
                                  <div key={i} style={{
                                    padding: "12px 8px",
                                    borderRadius: "12px",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    textAlign: "center",
                                    position: "relative",
                                    background: colors.bg,
                                    border: `1px solid ${colors.border}`,
                                    color: colors.text,
                                    minHeight: "100px",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                                  }}>
                                    <p style={{ fontSize: "13px", fontWeight: "700", lineHeight: "1.3", marginBottom: "4px", width: "100%" }}>{slotData.title}</p>
                                    <div style={{ fontSize: "11px", opacity: 0.8, fontWeight: "500", marginTop: "auto" }}>
                                      {slotData.code}
                                    </div>
                                  </div>
                                );
                              } else {
                                // Empty Slot
                                return (
                                  <div key={i} style={{
                                    minHeight: "100px",
                                    background: "rgba(255,255,255,0.4)",
                                    borderRadius: "12px",
                                    border: "1px dashed #E2E8F0"
                                  }} />
                                );
                              }
                            })}
                          </React.Fragment>
                        ))}
                      </div>

                      <div style={{ marginTop: "40px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
                        <div style={{ height: "4px", width: "40px", background: "#E2E8F0", borderRadius: "2px" }}></div>
                        <p style={{ color: "#94A3B8", fontSize: "14px", fontWeight: "500" }}>Generated on {new Date().toLocaleDateString()}</p>
                        <div style={{ height: "4px", width: "40px", background: "#E2E8F0", borderRadius: "2px" }}></div>
                      </div>
                    </div>
                    {/* --- GENERATED TABLE END --- */}

                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}