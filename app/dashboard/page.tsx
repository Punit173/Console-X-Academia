"use client";

import { useAppData } from "@/components/AppDataContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { PieChart, Pie, Legend } from "recharts";
import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { generateStandardPDF } from "@/utils/pdf-generator";
import ThreeDVisual from "@/components/ThreeDVisual";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  BookOpen,
  UserCheck,
  Clock,
  Users,
  Info,
  RefreshCw,
  Sparkles,
  Megaphone,
  Utensils,
  Trophy,
  Target,
  Calendar,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  limit,
} from "firebase/firestore";
import { app } from "@/lib/firebase";
import { SocialService } from "@/lib/socialService";
import { Post } from "@/types/social";
import { Newspaper, ExternalLink } from "lucide-react";

// --- QUOTES DATA ---
const QUOTES = [
  "The only way to do great work is to love what you do.",
  "Believe you can and you're halfway there.",
  "Your future is created by what you do today, not tomorrow.",
  "Education is the passport to the future.",
  "Don't watch the clock; do what it does. Keep going.",
  "Success is not final, failure is not fatal.",
  "The expert in anything was once a beginner.",
];

// --- BATCH DATA (Reused for Dashboard Logic) ---
const BATCH_TIMETABLES: any = {
  "1": {
    time_slots: [
      "08:00 - 08:50",
      "08:50 - 09:40",
      "09:45 - 10:35",
      "10:40 - 11:30",
      "11:35 - 12:25",
      "12:30 - 01:20",
      "01:25 - 02:15",
      "02:20 - 03:10",
      "03:10 - 04:00",
      "04:00 - 04:50",
      "04:50 - 05:30",
      "05:30 - 06:10",
    ],
    schedule: {
      "1": [
        "A",
        "A / X",
        "F / X",
        "F",
        "G",
        "P6",
        "P7",
        "P8",
        "P9",
        "P10",
        "L11",
        "L12",
      ],
      "2": [
        "P11",
        "P12/X",
        "P13/X",
        "P14",
        "P15",
        "B",
        "B",
        "G",
        "G",
        "A",
        "L21",
        "L22",
      ],
      "3": [
        "C",
        "C / X",
        "A / X",
        "D",
        "B",
        "P26",
        "P27",
        "P28",
        "P29",
        "P30",
        "L31",
        "L32",
      ],
      "4": [
        "P31",
        "P32/X",
        "P33/X",
        "P34",
        "P35",
        "D",
        "D",
        "B",
        "E",
        "C",
        "L41",
        "L42",
      ],
      "5": [
        "E",
        "E / X",
        "C / X",
        "F",
        "D",
        "P46",
        "P47",
        "P48",
        "P49",
        "P50",
        "L51",
        "L52",
      ],
    },
  },
  "2": {
    time_slots: [
      "08:00 - 08:50",
      "08:50 - 09:40",
      "09:45 - 10:35",
      "10:40 - 11:30",
      "11:35 - 12:25",
      "12:30 - 01:20",
      "01:25 - 02:15",
      "02:20 - 03:10",
      "03:10 - 04:00",
      "04:00 - 04:50",
      "04:50 - 05:30",
      "05:30 - 06:10",
    ],
    schedule: {
      "1": [
        "P1",
        "P2/X",
        "P3/X",
        "P4",
        "P5",
        "A",
        "A",
        "F",
        "F",
        "G",
        "L11",
        "L12",
      ],
      "2": [
        "B",
        "B / X",
        "G / X",
        "G",
        "A",
        "P16",
        "P17",
        "P18",
        "P19",
        "P20",
        "L21",
        "L22",
      ],
      "3": [
        "P21",
        "P22/X",
        "P23/X",
        "P24",
        "P25",
        "C",
        "C",
        "A",
        "D",
        "B",
        "L31",
        "L32",
      ],
      "4": [
        "D",
        "D / X",
        "B / X",
        "E",
        "C",
        "P36",
        "P37",
        "P38",
        "P39",
        "P40",
        "L41",
        "L42",
      ],
      "5": [
        "P41",
        "P42/X",
        "P43/X",
        "P44",
        "P45",
        "E",
        "E",
        "C",
        "F",
        "D",
        "L51",
        "L52",
      ],
    },
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const {
    data,
    fetchError,
    logout,
    credentials,
    isInitialized,
    refreshData,
    isLoading,
    lastUpdated,
  } = useAppData();

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute to refresh active class
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // 1 min
    return () => clearInterval(timer);
  }, []);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const db = getFirestore(app);
        const q = query(collection(db, "announcement"), limit(5));
        const snapshot = await getDocs(q);
        const eventsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort by date descending
        eventsList.sort((a: any, b: any) => {
          const parseDate = (d: string) => {
            try {
              const p = d.split("_");
              return new Date(
                parseInt(p[2]),
                parseInt(p[0]) - 1,
                parseInt(p[1]),
              );
            } catch {
              return new Date(0);
            }
          };
          return parseDate(b.date).getTime() - parseDate(a.date).getTime();
        });

        setAnnouncements(eventsList);
      } catch (e) {
        console.error("Failed to fetch announcements", e);
      }
    };
    fetchAnnouncements();
  }, []);

  // --- Carousel Timer ---
  useEffect(() => {
    if (announcements.length === 0) return;

    const totalSlides = 1 + announcements.length;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % totalSlides);
    }, 6000);
    return () => clearInterval(timer);
  }, [announcements]);

  // --- Recent Posts State ---
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [recentPostsLoading, setRecentPostsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        const res = await SocialService.getPosts(0, 5);
        setRecentPosts(res.posts);
      } catch (e) {
        console.error("Failed to fetch recent posts", e);
      } finally {
        setRecentPostsLoading(false);
      }
    };
    fetchRecentPosts();
  }, []);

  // --- Helper: Dynamic Greeting ---
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }, []);

  // --- Memoized Data Processing ---

  // 1. Today's Classes Logic
  const todaysClasses = useMemo(() => {
    if (!data) return [];

    const dayOrder = data.attendance?.day_order || 0;
    if (dayOrder < 1 || dayOrder > 5) return [];

    const studentBatch = data.timetable?.student_info?.batch || "1";
    const batchData =
      BATCH_TIMETABLES[`${studentBatch}`] || BATCH_TIMETABLES["1"];
    const daySlots = batchData.schedule[`${dayOrder}`] || [];
    const courses = data.timetable?.courses || [];

    const results: any[] = [];

    daySlots.forEach((slotCode: string, index: number) => {
      if (index >= batchData.time_slots.length) return;

      const timeSlot = batchData.time_slots[index];
      const slotOptions = slotCode.split("/").map((s: string) => s.trim());

      const course = courses.find((c: any) => {
        const rawSlot = (c.slot || "").replace(/-+$/, "").trim();
        if (rawSlot.includes("-")) {
          const parts = rawSlot.split("-").map((p: string) => p.trim());
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
        });
      }
    });
    return results;
  }, [data]);

  // --- Dynamic Theme Logic ---
  const currentSem = useMemo(() => {
    // Try to get semester from data, default to "sem1"
    // PRIORITY: Check attendance.student_info first (user updated this in demo-data), then timetable
    const sem =
      data?.attendance?.student_info?.semester ||
      data?.timetable?.student_info?.semester;
    if (sem) {
      // Normalize: "Semester 5" -> "sem5", "5" -> "sem5"
      const num = sem.toString().replace(/\D/g, "");
      return `sem${num}`;
    }
    return "sem1"; // Default
  }, [data]);

  const themeColor = useMemo(() => {
    const map: any = {
      sem1: "text-red-400 bg-red-500/10 border-red-500/20",
      sem2: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      sem3: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      sem4: "text-green-400 bg-green-500/10 border-green-500/20",
      sem5: "text-orange-400 bg-orange-500/10 border-orange-500/20",
      sem6: "text-pink-400 bg-pink-500/10 border-pink-500/20",
      sem7: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
      sem8: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    };
    return map[currentSem] || map["sem1"];
  }, [currentSem]);

  // Extract just the text color class for icons
  const accentTextColor = themeColor.split(" ")[0];
  const accentBgColor = themeColor.split(" ")[1];
  const accentBorderColor = themeColor.split(" ")[2];

  // --- Styles Helper for Subjects ---
  const getCourseTypeStyle = (type: string) => {
    if (type === "core")
      return {
        color: "text-orange-400",
        bg: "bg-orange-400/10",
        border: "border-orange-400/20",
      };
    if (type === "elective")
      return {
        color: "text-blue-400",
        bg: "bg-blue-400/10",
        border: "border-blue-400/20",
      };
    return {
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      border: "border-purple-400/20",
    };
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] animate-fade-in">
        <div
          className={`w-8 h-8 border-2 rounded-full animate-spin ${accentBorderColor} border-t-current ${accentTextColor}`}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
        <div className="p-6 rounded-full bg-primary/10 mb-4">
          <span className="text-4xl">🔐</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          Authentication Required
        </h2>
        <Link
          href="/"
          className="mt-4 px-6 py-2 bg-primary hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20"
        >
          Login
        </Link>
      </div>
    );
  }

  const courses = data.timetable?.courses || [];
  const advisors = data.timetable?.advisors || {
    faculty_advisor: { name: "N/A", email: "", phone: "" },
    academic_advisor: { name: "N/A", email: "", phone: "" },
  };

  // --- Chart Data Preparation ---
  const attendanceData = Object.entries(
    data?.attendance?.attendance?.courses || {},
  ).map(([code, c]: any) => {
    let displayName = code;

    // 1. Try to find a matching course in timetable using fuzzy matching
    // We check if the attendance code includes the timetable code or vice versa
    const matchedCourse = data.timetable?.courses?.find((tc: any) => {
      const tCode = (tc.course_code || "").toLowerCase().trim();
      const aCode = code.toLowerCase().trim();
      // Skip empty codes
      if (!tCode) return false;

      // Exact or prefix/suffix match
      // e.g. "21IPE314T" in "21IPE314TRegular"
      return (
        aCode === tCode ||
        aCode.startsWith(tCode) ||
        aCode.includes(tCode) ||
        tCode.includes(aCode)
      );
    });

    if (matchedCourse?.course_title) {
      displayName = matchedCourse.course_title;
    } else {
      // Fallback: Manually clean up the code if no timetable match found
      displayName = code
        .replace(/Regular|Arrear|Theory|Practical|Lab/gi, "")
        .trim();
    }

    return {
      name: displayName,
      attendance: c.attendance_percentage,
      conducted: c.hours_conducted || c.total_hours_conducted,
      attended:
        (c.hours_conducted || c.total_hours_conducted) -
        (c.hours_absent || c.total_hours_absent),
    };
  });

  const totalMarks = Object.values(data?.attendance?.marks || {}).reduce(
    (acc: any, course: any) => {
      course.tests.forEach((test: any) => {
        acc.obtained += test.obtained_marks || 0;
        acc.max += test.max_marks || 0;
      });
      return acc;
    },
    { obtained: 0, max: 0 },
  );

  // --- Tooltips ---
  const AttendanceTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
          <p className="text-white font-bold text-sm mb-1">{label}</p>
          <div className="space-y-1">
            <p className="text-xs text-gray-300">
              Attendance:{" "}
              <span
                className={
                  payload[0].value < 75
                    ? "text-red-400 font-bold"
                    : "text-green-400 font-bold"
                }
              >
                {payload[0].value}%
              </span>
            </p>
            <p className="text-xs text-gray-400">
              Classes: {payload[0].payload.attended}/
              {payload[0].payload.conducted}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const totalAttendance =
    attendanceData.length > 0
      ? Math.round(
          attendanceData.reduce(
            (sum: number, c: any) => sum + c.attendance,
            0,
          ) / attendanceData.length,
        )
      : 0;

  const totalMarksPercentage =
    totalMarks.max > 0
      ? Math.round((totalMarks.obtained / totalMarks.max) * 100)
      : 0;

  // --- PDF Export Logic ---
  const handleExport = (action: "download" | "share") => {
    setIsGenerating(true);
    generateStandardPDF(
      "Comprehensive Report",
      data,
      (doc, formatNumber, autoTable) => {
        // --- 1. Attendance Table ---
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.text("Attendance Summary", 14, 70);

        const attendanceRows = attendanceData.map((s: any) => [
          s.name,
          `${s.attendance}%`,
          `${s.attended}/${s.conducted}`,
        ]);

        autoTable(doc, {
          startY: 75,
          head: [["Course", "Percentage", "Classes"]],
          body: attendanceRows,
          theme: "grid",
          styles: {
            fillColor: [30, 41, 59],
            textColor: 255,
            lineColor: [50, 60, 80],
            lineWidth: 0.1,
          },
          headStyles: {
            fillColor: [236, 72, 153], // Pink accent
            textColor: 255,
            fontStyle: "bold",
          },
          alternateRowStyles: {
            fillColor: [40, 50, 70],
          },
        });

        // --- 2. Marks Table (If available) ---
        let finalY = (doc as any).lastAutoTable.finalY + 15;

        const marksData = data?.attendance?.marks || {};
        const marksRows: any[] = [];
        Object.entries(marksData).forEach(([code, details]: any) => {
          details.tests.forEach((test: any) => {
            marksRows.push([
              code,
              test.test_name,
              `${test.obtained_marks}/${test.max_marks}`,
            ]);
          });
        });

        if (marksRows.length > 0) {
          doc.setFontSize(14);
          doc.setTextColor(255, 255, 255);
          doc.text("Recent Marks", 14, finalY);

          autoTable(doc, {
            startY: finalY + 5,
            head: [["Course", "Assessment", "Score"]],
            body: marksRows,
            theme: "grid",
            styles: {
              fillColor: [30, 41, 59],
              textColor: 255,
              lineColor: [50, 60, 80],
              lineWidth: 0.1,
            },
            headStyles: {
              fillColor: [245, 158, 11], // Amber accent
              textColor: 255,
              fontStyle: "bold",
            },
            alternateRowStyles: {
              fillColor: [40, 50, 70],
            },
          });
        }
      },
      action,
      () => setIsGenerating(false),
      () => setIsGenerating(false),
    );
  };

  const today = new Date();
  const isWeekend = today.getDay() === 0 || today.getDay() === 6;
  // 0 = Sunday, 6 = Saturday

  const getInitials = (name?: string) => {
    if (!name) return "ST";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="w-full animate-fade-in space-y-8 relative">
      {/* 3D Visual Background Element */}
      <div className="absolute top-0 right-0 w-full h-[300px] overflow-hidden -z-10 opacity-60 pointer-events-none md:pointer-events-auto">
        <ThreeDVisual />
      </div>

      {/* 1. Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
        <div>
          {/* <h1 className="text-4xl font-bold text-white tracking-tight mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            {greeting}, {data.timetable?.student_info?.name?.split(' ')[0] || "Student"}!
          </h1> */}
        </div>
      </div>

      {fetchError && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-center gap-3 animate-slide-in">
          <div className="bg-yellow-500/20 p-2 rounded-full">
            <Info className="w-4 h-4 text-yellow-500" />
          </div>
          <div>
            <h4 className="text-yellow-500 font-bold text-sm">
              Academia is busy
            </h4>
            <p className="text-yellow-200/70 text-xs">
              Showing cached data. We'll keep trying to update it.
            </p>
          </div>
        </div>
      )}

      {/* 2.5. Split: LeetCode & Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* left: Student Profile Section */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden group h-full">
          {/* Background Logo */}
          {/* Background Logo */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none grayscale">
            <Image
              src="/assets/logo.jpg"
              alt="Background Logo"
              fill
              className="object-contain p-4"
            />
          </div>
          <div className="glass-card rounded-3xl p-6 relative overflow-hidden group h-full">
            {/* Soft gradient accent */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* ===== Header ===== */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                {/* Initials Avatar */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 flex items-center justify-center shadow-xl ring-2 ring-white/10">
                  <span className="text-white text-2xl font-black tracking-wide">
                    {getInitials(data.timetable?.student_info?.name)}
                  </span>
                </div>

                <div>
                  <h2 className="text-xl font-extrabold text-white leading-tight">
                    {data.timetable?.student_info?.name || "Student"}
                  </h2>
                  <p className="text-xs text-white/50 tracking-widest uppercase">
                    {data.timetable?.student_info?.program || "Student Profile"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => refreshData()}
                disabled={isLoading}
                className={`p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all ${accentTextColor} disabled:opacity-50`}
                title="Refresh Profile"
              >
                {isLoading ? (
                  <div
                    className={`w-4 h-4 animate-spin rounded-full border-2 ${accentBorderColor} border-t-transparent`}
                  />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* ===== Academic Summary ===== */}
            {/* ===== Academic Summary ===== */}
            <div className="mt-6 space-y-4 relative z-10">
              {/* Registration Number – PRIMARY */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">
                  Register No
                </p>
                <p className="text-base sm:text-lg font-mono font-extrabold text-white break-all leading-snug">
                  {data.timetable?.student_info?.registration_number || "N/A"}
                </p>
              </div>

              {/* Batch + Semester – SECONDARY */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <p className="text-[9px] text-white/40 uppercase font-semibold tracking-wider mb-0.5">
                    Batch
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-white">
                    {data.timetable?.student_info?.batch || "N/A"}
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <p className="text-[9px] text-white/40 uppercase font-semibold tracking-wider mb-0.5">
                    Semester
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-white capitalize">
                    {currentSem.replace("sem", "Sem ")}
                  </p>
                </div>
              </div>
            </div>

            {/* ===== Advisors ===== */}
            <div className="mt-6 pt-4 border-t border-white/10 space-y-3 relative z-10">
              <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/5 hover:border-primary/30 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                    Faculty Advisor
                  </p>
                  <p className="text-sm font-bold text-white truncate">
                    {advisors.faculty_advisor.name}
                  </p>
                  {advisors.faculty_advisor.email && (
                    <a
                      href={`mailto:${advisors.faculty_advisor.email}`}
                      className="text-[10px] text-primary hover:underline truncate block"
                    >
                      {advisors.faculty_advisor.email}
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/5 hover:border-blue-500/30 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                    Academic Advisor
                  </p>
                  <p className="text-sm font-bold text-white truncate">
                    {advisors.academic_advisor.name}
                  </p>
                  {advisors.academic_advisor.email && (
                    <a
                      href={`mailto:${advisors.academic_advisor.email}`}
                      className="text-[10px] text-blue-400 hover:underline truncate block"
                    >
                      {advisors.academic_advisor.email}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* right: LeetCode Section & Recent Club Posts */}
        <div className="flex flex-col gap-6 h-full">
          {/* Recent Club Posts Card */}
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden group flex-1">
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors pointer-events-none" />

            <div className="flex items-center justify-between mb-4 relative z-10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-1 h-5 bg-purple-500 rounded-full"></span>
                Club Highlights
              </h3>
              <Link
                href="/social"
                className="text-xs text-white/40 hover:text-purple-400 transition-colors flex items-center gap-1"
              >
                View All <ExternalLink size={12} />
              </Link>
            </div>

            {recentPostsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-white/5 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : recentPosts.length > 0 ? (
              <div className="space-y-3">
                {recentPosts.slice(0, 3).map((post) => (
                  <Link
                    key={post.post_id}
                    href="/social"
                    className="block p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-purple-500/30 transition-all group/post"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-black border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                        {post.club_icon_url ? (
                          <img
                            src={post.club_icon_url}
                            alt="Club"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users size={14} className="text-white/40" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-white truncate group-hover/post:text-purple-200 transition-colors">
                            {post.club_name ||
                              (post.individual_email
                                ? post.individual_email.split("@")[0]
                                : "Student")}
                          </p>
                          <span className="text-[10px] text-white/30 whitespace-nowrap ml-2">
                            {/* Simple Logic for time */}
                            {new Date(
                              post.timestamp * 1000,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-white/60 line-clamp-1 mt-0.5">
                          {post.content}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-white/30">
                <Newspaper size={24} className="mb-2 opacity-50" />
                <p className="text-xs">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* A. Attendance Chart */}
        {!attendanceData || attendanceData.length === 0 ? (
          <div className="w-full glass-card rounded-2xl p-6 flex flex-col items-center justify-center">
            {/* ...empty state... */}
            <p>No Data</p>
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-slate-900/50 to-slate-900/50 relative overflow-hidden group">
            {/* Decorative Glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-pink-500/5 rounded-full blur-3xl group-hover:bg-pink-500/10 transition-colors" />

            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 relative z-10">
              <span className="w-1 h-5 bg-pink-500 rounded-full"></span>
              Performance Overview
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 place-items-center relative z-10">
              {/* ===== Attendance Donut ===== */}
              <div className="flex flex-col items-center">
                <ResponsiveContainer width={220} height={220}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Present", value: totalAttendance },
                        { name: "Absent", value: 100 - totalAttendance },
                      ]}
                      dataKey="value"
                      innerRadius={75}
                      outerRadius={100}
                      startAngle={90}
                      endAngle={-270}
                      stroke="none"
                    >
                      <Cell
                        fill={
                          totalAttendance >= 75
                            ? "#2dd4bf"
                            : totalAttendance >= 65
                              ? "#fbbf24"
                              : "#fb7185"
                        }
                      />
                      <Cell fill="rgba(255,255,255,0.08)" />
                    </Pie>

                    {/* Center Text */}
                    <text
                      x="50%"
                      y="45%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-white text-3xl font-black"
                    >
                      {totalAttendance}%
                    </text>
                    <text
                      x="50%"
                      y="58%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-white/50 text-xs uppercase tracking-widest"
                    >
                      Attendance
                    </text>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* ===== Marks Donut ===== */}
              <div className="flex flex-col items-center">
                <ResponsiveContainer width={220} height={220}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Scored", value: totalMarksPercentage },
                        {
                          name: "Remaining",
                          value: 100 - totalMarksPercentage,
                        },
                      ]}
                      dataKey="value"
                      innerRadius={75}
                      outerRadius={100}
                      startAngle={90}
                      endAngle={-270}
                      stroke="none"
                    >
                      <Cell
                        fill={
                          totalMarksPercentage >= 75
                            ? "#60a5fa" // blue
                            : totalMarksPercentage >= 60
                              ? "#facc15" // yellow
                              : "#f87171" // red
                        }
                      />
                      <Cell fill="rgba(255,255,255,0.08)" />
                    </Pie>

                    {/* Center Text */}
                    <text
                      x="50%"
                      y="45%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-white text-3xl font-black"
                    >
                      {totalMarksPercentage}%
                    </text>
                    <text
                      x="50%"
                      y="58%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-white/50 text-xs uppercase tracking-widest"
                    >
                      Marks
                    </text>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* B. Today's Schedule */}
        <div className="glass-card rounded-2xl p-6 flex flex-col bg-gradient-to-br from-slate-900/50 to-slate-900/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors" />

          <div className="flex items-center justify-between mb-6 relative z-10">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-1 h-5 bg-purple-500 rounded-full"></span>
              Today's Schedule
            </h3>
            {isWeekend ? (
              <span className="text-xs bg-gray-500/20 text-gray-300 px-2 py-1 rounded border border-gray-500/30">
                Holiday
              </span>
            ) : data.attendance.day_order ? (
              <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded border border-purple-500/30">
                Day Order {data.attendance.day_order}
              </span>
            ) : (
              <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-1 rounded">
                Holiday
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar h-[350px] relative z-10">
            {!isWeekend && todaysClasses.length > 0 ? (
              todaysClasses.map((cls: any, idx: number) => {
                // Parse Time and Check Active
                // Format: "08:00 - 08:50"
                const [startStr, endStr] = cls.time
                  .split("-")
                  .map((s: string) => s.trim());

                const now = new Date();
                const [startH, startM] = startStr.split(":").map(Number);
                const [endH, endM] = endStr.split(":").map(Number);

                const startTime = new Date();
                startTime.setHours(startH, startM, 0);

                const endTime = new Date();
                // Handle PM cases implicitly? No, schedule is 24h or AM/PM?
                // Looking at BATCH_DATA, it's mixed "01:25", "03:10". Assumed 24h or handled logic.
                // Converting logic for 12h->24h if needed?
                // Let's assume the schedule strings are properly comparable or we fix them.
                // Actually BATCH_DATA uses "01:25", "02:20". These are likely PM.
                // Simple logic: If hour < 8, add 12? (Since classes are day time).

                const fixHour = (h: number) => (h < 8 ? h + 12 : h);
                startTime.setHours(fixHour(startH), startM, 0);

                endTime.setHours(fixHour(endH), endM, 0);

                const isActive = now >= startTime && now < endTime;

                return (
                  <div
                    key={idx}
                    className={`flex gap-3 p-3 rounded-xl border transition-all duration-500 group/item relative overflow-hidden ${
                      isActive
                        ? "bg-[#62D834]/10 border-[#62D834]/50 shadow-[0_0_15px_rgba(98,216,52,0.2)]"
                        : "bg-white/5 border-white/5 hover:bg-white/10"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#62D834] animate-pulse" />
                    )}

                    <div className="flex flex-col items-center justify-center min-w-[60px] border-r border-white/10 pr-3">
                      <span
                        className={`text-xs font-mono transition-colors ${isActive ? "text-[#62D834] font-bold" : "text-gray-400 group-hover/item:text-white"}`}
                      >
                        {cls.time.split("-")[0]}
                      </span>
                      <span
                        className={`text-xs font-bold font-mono ${isActive ? "text-[#62D834]" : "text-purple-400"}`}
                      >
                        {cls.time.split("-")[1]}
                      </span>
                      {isActive && (
                        <span className="text-[9px] bg-[#62D834] text-black font-bold px-1.5 py-0.5 rounded mt-1 animate-pulse">
                          NOW
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-bold truncate transition-colors ${isActive ? "text-white" : "text-white"}`}
                      >
                        {cls.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 border ${
                            isActive
                              ? "text-[#62D834] bg-[#62D834]/20 border-[#62D834]/30"
                              : "text-teal-300 bg-teal-500/20 border-teal-500/30"
                          }`}
                        >
                          <MapPin className="w-3 h-3" /> {cls.venue}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {cls.code}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <Calendar className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-sm">No classes scheduled today.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Useful Tools Section */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <span className="w-1 h-5 bg-[#62D834] rounded-full"></span>
          Useful Tools
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Feedback Filler Card */}
          <Link
            href="/feedback-filler"
            className="group relative bg-[#62D834] rounded-xl p-5 overflow-hidden hover:shadow-[0_0_30px_rgba(98,216,52,0.2)] transition-all transform hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 p-10 bg-black/10 rounded-full -mr-10 -mt-10" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-black/10 rounded-lg text-black">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="px-2 py-1 bg-black/20 text-black text-[10px] font-bold uppercase rounded-md">
                  New
                </span>
              </div>
              <h4 className="text-xl font-black text-black mb-1">
                Feedback Filler
              </h4>
              <p className="text-black/70 font-medium text-sm">
                Automate course feedback in seconds.
              </p>
            </div>
          </Link>

          {/* Mess Menu Card */}
          <Link
            href="/mess-menu"
            className="group relative bg-orange-500 rounded-xl p-5 overflow-hidden hover:shadow-[0_0_30px_rgba(249,115,22,0.2)] transition-all transform hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 p-10 bg-black/10 rounded-full -mr-10 -mt-10" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-black/10 rounded-lg text-black">
                  <Utensils className="w-6 h-6" />
                </div>
                <span className="px-2 py-1 bg-black/20 text-black text-[10px] font-bold uppercase rounded-md">
                  Hot
                </span>
              </div>
              <h4 className="text-xl font-black text-black mb-1">Mess Menu</h4>
              <p className="text-black/70 font-medium text-sm">
                Check what's cooking today.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
