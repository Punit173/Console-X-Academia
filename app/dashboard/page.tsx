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
} from "recharts";
import { useState, useMemo, useEffect } from "react";
import { generateStandardPDF } from "@/utils/pdf-generator";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  GraduationCap,
  Hash,
  Layers,
  ArrowRight,
  Calendar,
  MapPin,
  Share2,
  Download,
  BookOpen,
  UserCheck,
  Clock,
  Users,
  Info
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getFirestore, collection, getDocs, query, limit } from "firebase/firestore";
import { app } from "@/lib/firebase";

// --- BATCH DATA (Reused for Dashboard Logic) ---
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

export default function DashboardPage() {
  const router = useRouter();
  const { data, fetchError, logout, credentials } = useAppData();

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // useEffect(() => {
  //   if (!data && !fetchError) {
  //     router.push("/");
  //   }
  // }, [data, fetchError, router]);

  // --- Fetch Announcements ---
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const db = getFirestore(app);
        const q = query(collection(db, "announcement"), limit(5));
        const snapshot = await getDocs(q);
        const eventsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Sort by date descending
        eventsList.sort((a: any, b: any) => {
          const parseDate = (d: string) => {
            try {
              const p = d.split('_'); return new Date(parseInt(p[2]), parseInt(p[0]) - 1, parseInt(p[1]));
            } catch { return new Date(0); }
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


  // --- Memoized Data Processing ---

  // 1. Today's Classes Logic
  const todaysClasses = useMemo(() => {
    if (!data) return [];

    const dayOrder = data.attendance?.day_order || 0;
    if (dayOrder < 1 || dayOrder > 5) return [];

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
          slotCode: slotCode
        });
      }
    });
    return results;
  }, [data]);

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

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
        <div className="p-6 rounded-full bg-primary/10 mb-4">
          <span className="text-4xl">🔐</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Authentication Required</h2>
      </div>
    );
  }

  const courses = data.timetable?.courses || [];
  const advisors = data.timetable?.advisors || {
    faculty_advisor: { name: "N/A", email: "", phone: "" },
    academic_advisor: { name: "N/A", email: "", phone: "" }
  };

  // --- Chart Data Preparation ---
  const attendanceData = Object.entries(data?.attendance?.attendance?.courses || {}).map(([code, c]: any) => ({
    name: code.replace(/Theory|Practical/gi, ""),
    attendance: c.attendance_percentage,
    conducted: c.total_hours_conducted,
    attended: c.total_hours_conducted - c.total_hours_absent,
  }));

  const totalMarks = Object.values(data?.attendance?.marks || {}).reduce((acc: any, course: any) => {
    course.tests.forEach((test: any) => {
      acc.obtained += test.obtained_marks || 0;
      acc.max += test.max_marks || 0;
    });
    return acc;
  }, { obtained: 0, max: 0 });

  // --- Tooltips ---
  const AttendanceTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
          <p className="text-white font-bold text-sm mb-1">{label}</p>
          <div className="space-y-1">
            <p className="text-xs text-gray-300">
              Attendance: <span className={payload[0].value < 75 ? "text-red-400 font-bold" : "text-green-400 font-bold"}>{payload[0].value}%</span>
            </p>
            <p className="text-xs text-gray-400">Classes: {payload[0].payload.attended}/{payload[0].payload.conducted}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  // --- PDF Export Logic ---
  const handleExport = (action: "download" | "share") => {
    setIsGenerating(true);
    generateStandardPDF("Comprehensive Report", data, (doc, formatNumber) => {
      setIsGenerating(false);
    }, action, () => setIsGenerating(false), () => setIsGenerating(false));
  };

  return (
    <div className="w-full animate-fade-in space-y-6">

      {/* 1. Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Welcome back, {data.timetable?.student_info?.name?.split(' ')[0] || "Student"}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => handleExport("share")} disabled={isGenerating} className="p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-green-500/50 transition-all text-green-400 disabled:opacity-50"><Share2 className="w-5 h-5" /></button>
          <button onClick={() => handleExport("download")} disabled={isGenerating} className="p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all text-gray-400 hover:text-primary disabled:opacity-50">
            {isGenerating ? <div className="w-5 h-5 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <Download className="w-5 h-5" />}
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-orange-500/50 transition-all text-orange-400"
            >
              <User className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-64 glass-card rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-white/10 bg-black/20">
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Signed in as</p>
                    <p className="text-white text-sm font-medium truncate">{credentials?.email || "User"}</p>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={() => {
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      Log Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Demo Notification */}
      {data.timetable?.student_info?.registration_number === "RA2111003010001" && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-4 animate-fade-in mb-6">
          <div className="bg-blue-500/20 p-2 rounded-full shrink-0">
            <Info className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h4 className="text-blue-400 font-bold text-sm mb-1">Welcome! Academia is busy right now</h4>
            <p className="text-blue-200/80 text-xs leading-relaxed">
              You have entered this website for the first time, but Academia is currently unavailable.
              You can't see your specific marks and attendance right now, but you can still access and collect resources.
            </p>
          </div>
        </div>
      )}

      {fetchError && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-center gap-3 animate-slide-in">
          <div className="bg-yellow-500/20 p-2 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-yellow-500"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
          </div>
          <div>
            <h4 className="text-yellow-500 font-bold text-sm">Academia is busy now</h4>
            <p className="text-yellow-200/70 text-xs">
              We couldn't refresh your data, so we're showing the cached version. It might be slightly outdated.
            </p>
          </div>
        </div>
      )}

      {/* 2. Hero Widget (Profile / Announcement Carousel) */}
      <div className="relative w-full h-[220px] rounded-2xl overflow-hidden shadow-2xl group cursor-pointer" onClick={() => setActiveSlide((prev) => (prev + 1) % (1 + announcements.length))}>
        <AnimatePresence mode="wait">
          {activeSlide === 0 ? (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-400 p-8 flex flex-col justify-center"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-orange-100 font-medium tracking-wide text-sm uppercase">Student Profile</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">{data.timetable?.student_info?.name || "Student"}</h2>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-orange-50 text-sm font-medium">
                  <span className="flex items-center gap-1.5"><Hash className="w-4 h-4" /> {data.timetable?.student_info?.registration_number || "N/A"}</span>
                  <span className="flex items-center gap-1.5"><Layers className="w-4 h-4" /> Batch {data.timetable?.student_info?.batch || "N/A"}</span>
                  <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4" /> {data.timetable?.student_info?.specialization || "General"}</span>
                </div>
              </div>
            </motion.div>
          ) : (
            (() => {
              const item = announcements[activeSlide - 1];
              if (!item) return null; // Fallback
              const isAdmin = item.type === "admin";

        return (
          <motion.div
            key={`announcement-${item.id}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            style={
              item.img
                ? {
                    backgroundImage: `url(${item.img})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
            className={`absolute inset-0 p-8 flex flex-col justify-center relative overflow-hidden rounded-2xl shadow-inner z-0 ${
              item.img ? "" : isAdmin ? "bg-black" : "bg-white"
            }`}
          >
            {item.img && <div className="absolute inset-0 bg-black/40 pointer-events-none" />}

            {isAdmin ? (
              <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] bg-white/5 rounded-full blur-3xl pointer-events-none" />
            ) : (
              <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
            )}

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg backdrop-blur-sm ${isAdmin ? "bg-white/20" : "bg-orange-100"}`}>
                    <Calendar className={`w-5 h-5 ${isAdmin ? "text-white" : "text-orange-600"}`} />
                  </div>
                  <span className={`font-medium tracking-wide text-sm uppercase ${isAdmin ? "text-white/60" : "text-gray-500"}`}>
                    {item.type || "Announcement"}
                  </span>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded ${isAdmin ? "bg-white/10 text-white" : "bg-black/5 text-gray-600"}`}>
                  {item.date ? item.date.replace(/_/g, "/") : ""}
                </span>
              </div>

              <h2 className={`text-2xl font-bold mb-2 line-clamp-2 ${isAdmin ? "text-white" : item.img ? "text-white" : "text-gray-900"}`}>
                {item.title}
              </h2>

              <p className={`text-sm font-medium line-clamp-2 ${isAdmin ? "text-white/70" : item.img ? "text-white/80" : "text-gray-600"}`}>
                {item.desc || item.para || "No description available."}
              </p>

              {/* 🔗 LINK BUTTON (only appears if item.link exists) */}
              {item.link && (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-white/20 
                            hover:bg-white/30 transition text-white text-sm font-medium backdrop-blur-sm"
                >
                  Visit
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 3h7v7m0 0L10 21l-7-7L21 10z" />
                  </svg>
                </a>
              )}
            </div>
          </motion.div>
        );


            })()
          )}
        </AnimatePresence>

        {/* Pagination Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          <div className={`w-1.5 h-1.5 rounded-full transition-all ${activeSlide === 0 ? "bg-white w-4" : "bg-white/30"}`} />
          {announcements.map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${activeSlide === i + 1 ? "bg-white w-4" : "bg-white/30"}`} />
          ))}
        </div>
      </div>

      {/* 3. Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* A. Attendance Chart */}
        {!attendanceData || attendanceData.length === 0 ? (
          <div className="w-full glass-card rounded-xl p-6 flex flex-col items-center justify-center">
            <div className="w-40 sm:w-56 aspect-square">
              <iframe
                src="https://lottie.host/embed/0c5d0441-ffb9-413e-bfa0-71ceff08380f/KVJJRTZNgX.lottie"
                className="w-full h-full border-0"
                allowFullScreen
              />
            </div>
            <p className="mt-4 text-sm text-gray-400">
              No attendance data at this moment
            </p>
          </div>
        ) : (
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-1 h-5 bg-primary rounded-full"></span>
              Attendance
            </h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={attendanceData}
                  margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#718096"
                    tick={{ fill: "#718096", fontSize: 10 }}
                    tickFormatter={(val) =>
                      val.length > 5 ? val.substring(0, 5) + ".." : val
                    }
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#718096"
                    tick={{ fill: "#718096", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    unit="%"
                    domain={[0, 100]}
                  />
                  <Tooltip
                    content={<AttendanceTooltip />}
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  />
                  <Bar dataKey="attendance" radius={[4, 4, 0, 0]} barSize={30}>
                    {attendanceData.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.attendance >= 75
                            ? "#10B981"
                            : entry.attendance >= 65
                              ? "#F59E0B"
                              : "#EF4444"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* B. Today's Schedule */}
        <div className="glass-card rounded-xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-1 h-5 bg-purple-500 rounded-full"></span>
              Today's Schedule
            </h3>
            {data.attendance.day_order ? (
              <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded border border-purple-500/30">
                Day Order {data.attendance.day_order}
              </span>
            ) : (
              <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-1 rounded">Holiday</span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar h-[250px]">
            {todaysClasses.length > 0 ? (
              todaysClasses.map((cls: any, idx: number) => (
                <div key={idx} className="flex gap-3 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex flex-col items-center justify-center min-w-[60px] border-r border-white/10 pr-3">
                    <span className="text-xs text-gray-400 font-mono">{cls.time.split('-')[0]}</span>
                    <span className="text-xs text-purple-400 font-bold font-mono">{cls.time.split('-')[1]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{cls.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-gray-500 bg-black/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {cls.venue}
                      </span>
                      <span className="text-[10px] text-gray-500">{cls.code}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <Calendar className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-sm">No classes scheduled today.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Stats Footer (Quick Summary) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Credits', val: data.timetable?.total_credits || 0, color: 'text-white' },
          { label: 'Avg Attendance', val: `${(data.attendance?.attendance?.overall_attendance || 0).toFixed(1)}%`, color: 'text-emerald-400' },
          { label: 'Courses', val: (data.timetable?.courses?.length || 0), color: 'text-blue-400' },
          { label: 'Total Marks', val: `${totalMarks.obtained.toFixed(0)}/${totalMarks.max.toFixed(0)}`, color: 'text-purple-400' }
        ].map((stat, i) => (
          <div key={i} className="glass-card p-4 rounded-xl text-center hover:bg-white/5 transition-colors">
            <p className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</p>
            <p className={`text-xl font-bold mt-1 ${stat.color}`}>{stat.val}</p>
          </div>
        ))}
      </div>

      {/* 5. Academic Team (Advisors) */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
          Academic Advisors
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Faculty Advisor */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/5 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <p className="text-xs text-muted-foreground font-semibold">Faculty Advisor</p>
            </div>
            <p className="font-semibold text-white text-sm truncate">{advisors.faculty_advisor.name}</p>
            <a href={`mailto:${advisors.faculty_advisor.email}`} className="text-xs text-primary hover:underline truncate block mt-1">
              {advisors.faculty_advisor.email}
            </a>
          </div>

          {/* Academic Advisor */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/5 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <p className="text-xs text-muted-foreground font-semibold">Academic Advisor</p>
            </div>
            <p className="font-semibold text-white text-sm truncate">{advisors.academic_advisor.name}</p>
            <a href={`mailto:${advisors.academic_advisor.email}`} className="text-xs text-primary hover:underline truncate block mt-1">
              {advisors.academic_advisor.email}
            </a>
          </div>
        </div>
      </div>

      {/* 6. Enrolled Courses List */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <span className="w-1 h-6 bg-primary rounded-full" />
            Enrolled Courses
          </h2>
          <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-full">
            {courses.length} Courses
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map((c: any, index: number) => {
            const style = getCourseTypeStyle(c.course_type);
            return (
              <div
                key={c.s_no || index}
                className="glass-card rounded-xl p-4 sm:p-5 hover:border-primary/30 transition-all duration-300 group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 md:gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide border ${style.bg} ${style.color} ${style.border}`}>
                        {c.course_type}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground break-all">
                        {c.course_code}
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-base sm:text-lg group-hover:text-primary transition-colors break-words">
                      {c.course_title}
                    </h3>
                  </div>
                  <div className="flex items-center justify-start md:justify-end gap-2 flex-shrink-0">
                    <div className="text-center px-3 sm:px-4 py-2 bg-white/5 rounded-lg border border-white/5">
                      <p className="text-[10px] text-muted-foreground uppercase">Credits</p>
                      <p className="text-lg font-bold text-white">{c.credit}</p>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-white/5">
                  {/* Slot */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-gray-400 shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">Slot</p>
                      <p className="text-sm text-white font-medium">{c.slot}</p>
                    </div>
                  </div>

                  {/* Room */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-gray-400 shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">Room</p>
                      <p className="text-sm text-white font-medium">{c.room_no || "TBA"}</p>
                    </div>
                  </div>

                  {/* Faculty */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-gray-400 shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">Faculty</p>
                      <p className="text-sm text-white font-medium truncate" title={c.faculty_name}>
                        {c.faculty_name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}