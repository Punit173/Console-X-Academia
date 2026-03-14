// app/attendance/page.tsx
"use client";

import { useAppData } from "@/components/AppDataContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Share2,
  Download,
  ArrowUpRight,
  Clock,
  UserCheck,
  BarChart2 as BarChartIcon,
  RefreshCw,
} from "lucide-react";

export default function AttendancePage() {
  const router = useRouter();
  const { data: apiData, refreshData, isInitialized } = useAppData();
  const data = apiData;

  const [isGenerating, setIsGenerating] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  const handleHardReload = async () => {
  if (isReloading) return;
  setIsReloading(true);
  try {
  await refreshData(); // fetch latest before full reload
  window.location.reload(); // hard page reload
  } finally {
  setIsReloading(false);
  }
  };

  useEffect(() => {
    if (isInitialized && !data) {
      router.push("/");
    }
  }, [isInitialized, data, router]);

  // --- Theme Helpers: Strict Blue/White/Black Palette ---

  // --- Theme Helpers: "Comfortable" Palette (Teal / Amber / Rose) ---
  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 75) return "text-teal-400"; // Calming Teal
    if (percentage >= 65) return "text-amber-400"; // Warm Amber (Warning)
    return "text-rose-400"; // Softer Rose (Critical)
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 75)
      return "bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.4)]";
    if (percentage >= 65)
      return "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]";
    return "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]";
  };

  const getAttendanceStatus = (percentage: number) => {
    if (percentage >= 80) return "Great";
    if (percentage >= 75) return "Good";
    if (percentage >= 65) return "Warning";
    return "Action Needed";
  };

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in bg-black">
        <div className="p-6 rounded-full bg-blue-950/30 border border-blue-800/50 mb-4 shadow-[0_0_15px_rgba(30,58,138,0.2)]">
          <span className="text-4xl text-white">🔐</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          Authentication Required
        </h2>
        <p className="text-blue-300/60 text-sm mb-6">
          Please login from the home page to view your attendance.
        </p>
        <Link
          href="/"
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          Login Now
        </Link>
      </div>
    );
  }

  const attendance = data.attendance?.attendance || {
    overall_attendance: 0,
    total_hours_conducted: 0,
    courses: {},
  };
  const courses = attendance.courses || {};

  const getMatchedCourseTitle = (code: string, fallbackTitle?: string) => {
    const matchedCourse = data.timetable?.courses?.find((tc: any) => {
      const tCode = (tc.course_code || "").toLowerCase().trim();
      const aCode = code.toLowerCase().trim();
      if (!tCode) return false;
      return (
        aCode === tCode ||
        aCode.startsWith(tCode) ||
        aCode.includes(tCode) ||
        tCode.includes(aCode)
      );
    });

    return (
      matchedCourse?.course_title ||
      fallbackTitle ||
      code.replace(/Regular|Arrear|Theory|Practical/gi, "").trim()
    );
  };

  const getMarginInfo = (conducted: number, absent: number, percentage: number) => {
    const threshold = 75;
    const present = conducted - absent;

    if (percentage >= threshold) {
      const maxTotal = present / (threshold / 100);
      const safeBunks = Math.max(0, Math.floor(maxTotal - conducted));
      return {
        marginText: `${safeBunks}`,
        marginLabel: "Margin",
        marginType: (safeBunks > 0 ? "safe" : "warning") as
          | "safe"
          | "warning"
          | "danger",
      };
    }

    const targetRatio = threshold / 100;
    const needed = Math.ceil(
      (targetRatio * conducted - present) / (1 - targetRatio),
    );
    return {
      marginText: `${needed}`,
      marginLabel: "Classes needed",
      marginType: "danger" as "safe" | "warning" | "danger",
    };
  };

  const courseRows = Object.entries(courses).map(([code, c]: any) => {
    const conducted = c.hours_conducted || c.total_hours_conducted || 0;
    const absent = c.hours_absent || c.total_hours_absent || 0;
    const percentage = c.attendance_percentage || 0;
    const displayName = getMatchedCourseTitle(code, c.course_title);
    const { marginText, marginLabel, marginType } = getMarginInfo(
      conducted,
      absent,
      percentage,
    );

    return {
      code,
      displayName,
      conducted,
      absent,
      percentage,
      marginText,
      marginLabel,
      marginType,
    };
  });

  const handleExport = (action: "download" | "share") => {
    if (!data || !attendance) return;
    setIsGenerating(true);

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // 1. Dark Background
    doc.setFillColor(2, 6, 23); // Slate 950 (Deep Dark)
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    // 2. Grid Pattern (Simulate CSS grid)
    doc.setDrawColor(30, 41, 59); // Slate 800 lines
    const step = 10;
    for (let x = 0; x <= pageWidth; x += step) {
      doc.line(x, 0, x, pageHeight);
    }
    for (let y = 0; y <= pageHeight; y += step) {
      doc.line(0, y, pageWidth, y);
    }

    // 3. Title & Metadata
    doc.setFontSize(22);
    doc.setTextColor(20, 184, 166); // Teal 500
    doc.text("CONSOLE X ACADEMIA", 14, 20);

    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("Attendance Report", 14, 35);

    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184); // Slate 400
    const studentInfo = (data as any).student_info || {};
    doc.text(`Name: ${studentInfo.student_name || "Student"}`, 14, 45);
    doc.text(`Reg No: ${studentInfo.register_number || "N/A"}`, 14, 50);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 55);

    // 4. Overall Stats
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text(
      `Overall Attendance: ${attendance.overall_attendance.toFixed(1)}%`,
      14,
      70,
    );

    // 5. Transform Data
    const tableRows = Object.entries(courses).map(([code, c]: any) => {
      // Robust Course Title Match
      const matchedCourse = data.timetable?.courses?.find((tc: any) => {
        const tCode = (tc.course_code || "").toLowerCase().trim();
        const aCode =
          c.course_code?.toLowerCase().trim() || code.toLowerCase().trim();
        if (!tCode) return false;
        return (
          aCode === tCode || aCode.startsWith(tCode) || tCode.includes(aCode)
        );
      });
      const title = matchedCourse?.course_title || c.course_title || code;

      // Robust Data Access (Fix undefined issue)
      const conducted = c.hours_conducted || c.total_hours_conducted || 0;
      const absent = c.hours_absent || c.total_hours_absent || 0;
      const present = conducted - absent;
      const percentage = c.attendance_percentage || 0;

      // Margin Logic
      const threshold = 75;
      let marginText = "";
      if (percentage >= threshold) {
        const maxTotal = present / (threshold / 100);
        const safeBunks = Math.floor(maxTotal - conducted);
        marginText = safeBunks > 0 ? `Margin: ${safeBunks} hrs` : "No Margin";
      } else {
        const targetRatio = threshold / 100;
        const needed = Math.ceil(
          (targetRatio * conducted - present) / (1 - targetRatio),
        );
        marginText = `Required: ${needed} hrs`;
      }

      return [
        title,
        `${conducted}`,
        `${absent}`,
        `${percentage.toFixed(1)}%`,
        marginText,
        getAttendanceStatus(percentage),
      ];
    });

    // 6. Generate Table
    autoTable(doc, {
      startY: 80,
      head: [
        ["Course", "Conducted", "Absent", "Percentage", "Margin", "Status"],
      ],
      body: tableRows,
      theme: "grid",
      styles: {
        fillColor: [2, 6, 23], // Slate 950
        textColor: [226, 232, 240], // Slate 200
        lineColor: [30, 41, 59], // Slate 800
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [15, 23, 42], // Slate 900
        textColor: [45, 212, 191], // Teal 400
        fontStyle: "bold",
        lineColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [2, 6, 23], // Keep dark
      },
    });

    if (action === "download") {
      doc.save("Attendance_Report.pdf");
      setIsGenerating(false);
    } else {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full min-h-screen animate-fade-in space-y-6 md:space-y-8 pb-10">
      {/* Header */}
      <div className="top-0 z-50  backdrop-blur-xl flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/70 pb-5 pt-4 -mt-4 relative transition-all">
        {/* Glow effect - restricted to navy/blue */}
        <div className="absolute -left-4 top-0 w-20 h-20 bg-blue-900/20 blur-3xl rounded-full pointer-events-none"></div>
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1 sm:mb-2 drop-shadow-sm">
            Attendance <span className="text-blue-200">Overview</span>
          </h1>
          <p className="text-blue-100/70 text-xs sm:text-sm font-medium max-w-[34ch]">
            Track your presence and eligibility across all courses.
          </p>
        </div>

        {/* Actions */}
        {/* Actions - Combined or Simplified if needed, currently kept minimal or removed as per request to match clean UI */}
        <div className="grid grid-cols-4 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Buttons removed to match the reference 'clean' look if desired, or keep them if functionality is needed. 
                 User said "attendance dashboar ui is not good", implying they want the NEW look. 
                 The new look in screenshot DOES have buttons for Share, Predict, Download. 
                 Wait, the screenshot HAS them: Share (icon), Predict (Button), Download (Icon).
                 I should aligning them to look exactly like the screenshot. 
             */}
          <button
            onClick={handleHardReload}
            disabled={isGenerating || isReloading}
            className="h-11 sm:h-auto sm:p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-cyan-300 disabled:opacity-50 flex items-center justify-center"
            title="Hard Reload"
            aria-label="Hard Reload"
          >
            <RefreshCw
              className={"w-5 h-5 " + (isReloading ? "animate-spin" : "")}
            />
          </button>
          {/* <button
            onClick={() => handleExport("share")}
            disabled={isGenerating}
            className="h-11 sm:h-auto sm:p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-blue-400 flex items-center justify-center"
          >
            <Share2 className="w-5 h-5" />
          </button> */}

          <Link
            href="/attendance/predict"
            className="col-span-2 sm:col-auto h-11 sm:h-auto px-4 sm:px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-white font-semibold flex items-center justify-center gap-2"
          >
            Predict <ArrowUpRight className="w-4 h-4" />
          </Link>

          <button
            onClick={() => handleExport("download")}
            disabled={isGenerating}
            className="h-11 sm:h-auto sm:p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-white flex items-center justify-center"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Overall Attendance */}
        <div className="relative sm:col-span-2 lg:col-span-1 overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-900/35 backdrop-blur-md p-5 sm:p-6 group transition-all duration-300 shadow-lg shadow-black/30 hover:bg-slate-900/45 hover:border-slate-700/80">
          <div
            className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${getAttendanceColor(attendance.overall_attendance)}`}
          >
            <BarChartIcon className="w-24 h-24" />
          </div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 sm:mb-4">
            Overall Attendance
          </p>
          <div className="flex items-baseline gap-2 relative z-10">
            <span
              className={`text-3xl sm:text-4xl md:text-5xl font-bold ${getAttendanceColor(attendance.overall_attendance)}`}
            >
              {attendance.overall_attendance.toFixed(1)}
            </span>
            <span className="text-xl text-gray-400">%</span>
          </div>
          {/* Progress Bar Container */}
          <div className="mt-4 w-full bg-slate-800/50 rounded-full h-2 overflow-hidden shadow-inner border border-white/5 relative z-10">
            <div
              className={`h-full ${getProgressBarColor(attendance.overall_attendance)} transition-all duration-1000 relative`}
              style={{
                width: `${Math.min(attendance.overall_attendance, 100)}%`,
              }}
            >
              {/* Subtle Shine */}
              <div className="absolute top-0 right-0 bottom-0 w-full bg-gradient-to-l from-white/20 to-transparent"></div>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Status:{" "}
            <span
              className={`font-bold tracking-wide ${getAttendanceColor(attendance.overall_attendance)}`}
            >
              {getAttendanceStatus(attendance.overall_attendance)}
            </span>
          </p>
        </div>

        {/* Total Hours Conducted */}
        <div
          className="relative overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-900/35 backdrop-blur-md p-5 md:p-6 min-h-[150px] md:min-h-0 flex flex-col justify-between group transition-all duration-300 shadow-lg shadow-black/30 hover:bg-slate-900/45 hover:border-slate-700/80"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-blue-400">
            <Clock className="w-24 h-24" />
          </div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 sm:mb-4">
            Hours Conducted
          </p>
          <p className="text-3xl sm:text-4xl md:text-5xl font-bold">
            {attendance.total_hours_conducted}
          </p>
        </div>

        {/* Total Hours Absent */}
        <div
          className="relative overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-900/35 backdrop-blur-md p-5 md:p-6 min-h-[150px] md:min-h-0 flex flex-col justify-between group transition-all duration-300 shadow-lg shadow-black/30 hover:bg-slate-900/45 hover:border-slate-700/80"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-red-400">
            <UserCheck className="w-24 h-24" />
          </div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 sm:mb-4">
            Hours Absent
          </p>
          <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-white relative z-10">
            {attendance.total_hours_absent}
          </p>
        </div>
      </div>

      {/* Per-Course Attendance */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="w-1.5 h-6 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.6)]"></span>
          Course Breakdown
        </h2>

        {Object.keys(courses).length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-blue-900/20 bg-blue-950/20">
            <p className="text-blue-200/50">
              No course attendance data available.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {courseRows.map((course) => (
                <div
                  key={course.code}
                  className="rounded-2xl border border-slate-800/80 bg-slate-900/35 p-4 shadow-md shadow-black/25"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white leading-snug break-words">
                        {course.displayName}
                      </p>
                      <p className="text-[11px] mt-1 text-gray-400 font-mono break-all">
                        {course.code.replace(/Regular|Arrear/gi, "").toUpperCase()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-2xl font-bold ${getAttendanceColor(course.percentage)}`}>
                        {course.percentage.toFixed(1)}%
                      </p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                        {getAttendanceStatus(course.percentage)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 h-1.5 rounded-full bg-slate-800/70 overflow-hidden">
                    <div
                      className={`h-full ${getProgressBarColor(course.percentage)}`}
                      style={{ width: `${Math.min(course.percentage, 100)}%` }}
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="px-2 py-1.5 border-r border-slate-800/70">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400">Done</p>
                      <p className="text-sm font-semibold text-white">{course.conducted}</p>
                    </div>
                    <div className="px-2 py-1.5 border-r border-slate-800/70">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400">Missed</p>
                      <p className="text-sm font-semibold text-white">{course.absent}</p>
                    </div>
                    <div className="px-2 py-1.5">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400">Margin</p>
                      <p
                        className={`text-sm font-semibold ${
                          course.marginType === "safe"
                            ? "text-teal-300"
                            : course.marginType === "warning"
                              ? "text-amber-300"
                              : "text-rose-300"
                        }`}
                      >
                        {course.marginText}
                      </p>
                    </div>
                  </div>

                  <p
                    className={`mt-2 text-[11px] ${
                      course.marginType === "safe"
                        ? "text-teal-300"
                        : course.marginType === "warning"
                          ? "text-amber-300"
                          : "text-rose-300"
                    }`}
                  >
                    {course.marginLabel}
                  </p>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block rounded-2xl border border-slate-800/70 bg-slate-900/35 backdrop-blur-md overflow-hidden shadow-lg shadow-black/30">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/70 bg-transparent">
                      <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Course
                      </th>
                      <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">
                        Attendance
                      </th>
                      <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">
                        Hours
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {courseRows.map((course) => (
                      <tr
                        key={course.code}
                        className="group transition-colors border-slate-800/70 hover:bg-slate-900/35"
                      >
                        <td className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <span className="font-semibold text-gray-200 text-base group-hover:text-white transition-colors">
                                {course.displayName}
                              </span>
                              <span className="block mt-1 text-[11px] font-mono text-gray-500 bg-black/20 px-1.5 py-0.5 rounded w-fit uppercase">
                                {course.code.replace(/Regular|Arrear/gi, "").toUpperCase()}
                              </span>
                            </div>
                            <div className="text-right">
                              <p
                                className={`text-base font-semibold ${
                                  course.marginType === "safe"
                                    ? "text-teal-300"
                                    : course.marginType === "warning"
                                      ? "text-amber-300"
                                      : "text-rose-300"
                                }`}
                              >
                                {course.marginText}
                              </p>
                              <p className="text-xs text-gray-500">{course.marginLabel}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center justify-center h-full">
                            <span
                              className={`text-xl font-bold ${getAttendanceColor(course.percentage)}`}
                            >
                              {course.percentage.toFixed(1)}%
                            </span>
                            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest mt-0.5">
                              {getAttendanceStatus(course.percentage)}
                            </span>
                          </div>
                        </td>

                        <td className="p-4 text-center">
                          <div className="flex flex-col gap-1 items-center justify-center h-full">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-gray-500 w-10 text-right">Done</span>
                              <span className="text-gray-300 font-medium">{course.conducted}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-gray-500 w-10 text-right">Missed</span>
                              <span className="text-gray-300 font-medium">{course.absent}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
