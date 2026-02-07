"use client";

import { useAppData } from "@/components/AppDataContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ThreeDVisual from "@/components/ThreeDVisual";
import { generateStandardPDF } from "@/utils/pdf-generator";
import Link from "next/link";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Share2, Download, ArrowUpRight, Clock, UserCheck, BarChart2 as BarChartIcon } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";


export default function AttendancePage() {
  const router = useRouter();
  const { data: apiData } = useAppData();
  const data = apiData;

  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!data) {
      router.push("/");
    }
  }, [data, router]);


  // --- Theme Helpers: "Comfortable" Palette (Teal / Amber / Rose) ---
  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 75) return "text-teal-400"; // Calming Teal
    if (percentage >= 65) return "text-amber-400"; // Warm Amber (Warning)
    return "text-rose-400"; // Softer Rose (Critical)
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 75) return "bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.4)]";
    if (percentage >= 65) return "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]";
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
        <h2 className="text-xl font-bold text-white mb-2">Authentication Required</h2>
        <p className="text-blue-300/60 text-sm mb-6">Please login from the home page to view your attendance.</p>
        <Link
          href="/"
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          Login Now
        </Link>
      </div>
    );
  }

  const attendance = data.attendance?.attendance || { overall_attendance: 0, total_hours_conducted: 0, courses: {} };
  const courses = attendance.courses || {};


  const handleExport = (action: 'download' | 'share') => {
    if (!data || !attendance) return;
    setIsGenerating(true);

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // 1. Dark Background
    doc.setFillColor(2, 6, 23); // Slate 950 (Deep Dark)
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

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
    doc.text('CONSOLE X ACADEMIA', 14, 20);

    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('Attendance Report', 14, 35);

    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184); // Slate 400
    const studentInfo = (data as any).student_info || {};
    doc.text(`Name: ${studentInfo.student_name || 'Student'}`, 14, 45);
    doc.text(`Reg No: ${studentInfo.register_number || 'N/A'}`, 14, 50);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 55);

    // 4. Overall Stats
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text(`Overall Attendance: ${attendance.overall_attendance.toFixed(1)}%`, 14, 70);

    // 5. Transform Data
    const tableRows = Object.entries(courses).map(([code, c]: any) => {
      // Robust Course Title Match
      const matchedCourse = data.timetable?.courses?.find((tc: any) => {
        const tCode = (tc.course_code || "").toLowerCase().trim();
        const aCode = c.course_code?.toLowerCase().trim() || code.toLowerCase().trim();
        if (!tCode) return false;
        return aCode === tCode || aCode.startsWith(tCode) || tCode.includes(aCode);
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
        const needed = Math.ceil((targetRatio * conducted - present) / (1 - targetRatio));
        marginText = `Required: ${needed} hrs`;
      }

      return [
        title,
        `${conducted}`,
        `${absent}`,
        `${percentage.toFixed(1)}%`,
        marginText,
        getAttendanceStatus(percentage)
      ];
    });

    // 6. Generate Table
    autoTable(doc, {
      startY: 80,
      head: [['Course', 'Conducted', 'Absent', 'Percentage', 'Margin', 'Status']],
      body: tableRows,
      theme: 'grid',
      styles: {
        fillColor: [2, 6, 23], // Slate 950
        textColor: [226, 232, 240], // Slate 200
        lineColor: [30, 41, 59], // Slate 800
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [15, 23, 42], // Slate 900
        textColor: [45, 212, 191], // Teal 400
        fontStyle: 'bold',
        lineColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [2, 6, 23], // Keep dark
      },
    });

    if (action === 'download') {
      doc.save('Attendance_Report.pdf');
      setIsGenerating(false);
    } else {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full animate-fade-in space-y-8 pb-10 relative">

      {/* 3D Visual Background Element */}
      <div className="absolute top-0 right-0 w-full h-[300px] overflow-hidden -z-10 opacity-60 pointer-events-none md:pointer-events-auto mt-14 md:mt-0">
        <ThreeDVisual />
      </div>

      {/* Header */}
      <div className="pb-4 pt-4 mb-6 transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

          {/* Title Section */}
          <div className="relative">
            <div className="absolute -left-10 -top-10 w-32 h-32 bg-blue-500/20 blur-[60px] rounded-full pointer-events-none"></div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-1 drop-shadow-sm flex items-center gap-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-white to-blue-200">
                Attendance
              </span>
              <span className="text-blue-500">.</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium pl-0.5">
              Track your presence & predict your future.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto">

            <button
              onClick={() => handleExport('share')}
              disabled={isGenerating}
              className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-slate-400 hover:text-white transition-all active:scale-95"
              title="Share Report"
            >
              <Share2 className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleExport('download')}
              disabled={isGenerating}
              className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-slate-400 hover:text-white transition-all active:scale-95"
              title="Download Report"
            >
              <Download className="w-5 h-5" />
            </button>

            {/* Predict Button with Highlight */}
            <div className="relative group/predict">
              {/* Ping Effect to grab attention */}
              <div className="absolute -inset-0.5 bg-teal-500 rounded-xl blur opacity-30 group-hover/predict:opacity-75 transition duration-1000 group-hover/predict:duration-200 animate-pulse"></div>

              <Link
                href="/attendance/predict"
                className="relative flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="relative z-10">Predict Future</span>
                <ArrowUpRight className="w-4 h-4 relative z-10 group-hover/predict:translate-x-0.5 group-hover/predict:-translate-y-0.5 transition-transform" />

                {/* "NEW" Badge */}
                <span className="absolute -top-2 -right-2 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[8px] font-bold items-center justify-center text-white border border-rose-400">!</span>
                </span>
              </Link>
            </div>

          </div>
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
            <p className="text-blue-200/50">No course attendance data available.</p>
          </div>
        ) : (
          <>
            {/* MOBILE: Compact List View (No Scroll) */}
            <div className="flex flex-col gap-2 md:hidden">
              {Object.entries(courses).map(([code, c]: any, index) => {
                const matchedCourse = data.timetable?.courses?.find((tc: any) => {
                  const tCode = (tc.course_code || "").toLowerCase().trim();
                  const aCode = code.toLowerCase().trim();
                  return tCode && (aCode === tCode || aCode.startsWith(tCode) || aCode.includes(tCode) || tCode.includes(aCode));
                });
                const displayName = matchedCourse?.course_title || c.course_title || code.replace(/Regular|Arrear|Theory|Practical/gi, "").trim();
                const conducted = c.hours_conducted || c.total_hours_conducted || 0;
                const absent = c.hours_absent || c.total_hours_absent || 0;
                const present = conducted - absent;
                const percentage = c.attendance_percentage || 0;

                // Margin Logic
                const threshold = 75;
                let marginValue = 0;
                let marginLabel = "";
                let marginType: "safe" | "warning" | "danger" = "safe";

                if (percentage >= threshold) {
                  const maxTotal = present / (threshold / 100);
                  const safeBunks = Math.floor(maxTotal - conducted);
                  marginValue = safeBunks;
                  marginLabel = "Safe";
                  marginType = safeBunks > 0 ? "safe" : "warning";
                } else {
                  const targetRatio = threshold / 100;
                  const needed = Math.ceil((targetRatio * conducted - present) / (1 - targetRatio));
                  marginValue = needed;
                  marginLabel = "Need";
                  marginType = "danger";
                }

                return (
                  <div
                    key={code}
                    onClick={() => router.push(`/marks?highlight=${code}`)}
                    className="glass-card p-4 rounded-xl flex items-center justify-between active:scale-[0.95] transition-all"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                      <div className={`w-1 h-10 rounded-full ${percentage >= 75 ? 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]' : percentage >= 65 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}></div>
                      <div className="flex flex-col min-w-0 gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${getAttendanceColor(percentage)}`}>{percentage.toFixed(0)}%</span>
                          <span className="text-[10px] font-mono text-gray-500 uppercase bg-white/5 px-1 rounded">{code.slice(0, 8)}</span>
                        </div>
                        <h4 className="text-sm font-medium text-gray-300 truncate pr-2 leading-tight">{displayName}</h4>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center pl-4 border-l border-white/5">
                      <span className={`text-3xl font-black tracking-tighter leading-none ${marginType === 'safe' ? 'text-teal-400 drop-shadow-[0_0_10px_rgba(45,212,191,0.3)]' :
                        marginType === 'warning' ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]' :
                          'text-rose-400 drop-shadow-[0_0_10px_rgba(251,113,133,0.3)]'
                        }`}>
                        {marginValue}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP: Full Grid View */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Object.entries(courses).map(([code, c]: any, index) => {
                // --- Robust Title Matching ---
                const matchedCourse = data.timetable?.courses?.find((tc: any) => {
                  const tCode = (tc.course_code || "").toLowerCase().trim();
                  const aCode = code.toLowerCase().trim();
                  if (!tCode) return false;
                  return aCode === tCode || aCode.startsWith(tCode) || aCode.includes(tCode) || tCode.includes(aCode);
                });
                const displayName = matchedCourse?.course_title || c.course_title || code.replace(/Regular|Arrear|Theory|Practical/gi, "").trim();

                // --- Margin Calculation Logic ---
                const threshold = 75;
                const conducted = c.hours_conducted || c.total_hours_conducted || 0;
                const absent = c.hours_absent || c.total_hours_absent || 0;
                const present = conducted - absent;
                const percentage = c.attendance_percentage || 0;

                let marginValue = 0;
                let marginLabel = "";
                let marginType: "safe" | "warning" | "danger" = "safe";

                if (percentage >= threshold) {
                  const maxTotal = present / (threshold / 100);
                  const safeBunks = Math.floor(maxTotal - conducted);
                  marginValue = safeBunks;
                  if (safeBunks > 0) {
                    marginLabel = "Safe Bunks";
                    marginType = "safe";
                  } else {
                    marginLabel = "On Edge";
                    marginType = "warning";
                  }
                } else {
                  const targetRatio = threshold / 100;
                  const needed = Math.ceil((targetRatio * conducted - present) / (1 - targetRatio));
                  marginValue = needed;
                  marginLabel = "Must Attend";
                  marginType = "danger";
                }

                return (
                  <div
                    key={code}
                    onClick={() => router.push(`/marks?highlight=${code}`)}
                    className="glass-card relative flex flex-col justify-between p-5 rounded-2xl hover:border-white/10 transition-all group overflow-hidden cursor-pointer active:scale-[0.98]"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Background Gradient for Status */}
                    <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full opacity-10 pointer-events-none -mr-16 -mt-16 ${percentage >= 75 ? 'bg-teal-500' : percentage >= 65 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}></div>

                    {/* Header: Course Title */}
                    <div className="mb-4 relative z-10 flex flex-col gap-1">
                      <span className="text-[10px] font-mono font-bold text-gray-500 bg-black/40 border border-white/5 px-1.5 py-0.5 rounded uppercase w-fit">
                        {code.replace(/Regular|Arrear/gi, "").replace(/Theory|Practical/gi, "").trim()}
                      </span>
                      <h4 className="text-sm font-bold text-gray-300 leading-tight line-clamp-1 group-hover:text-white transition-colors" title={displayName}>
                        {displayName}
                      </h4>
                    </div>

                    {/* Body: Margin / Required (HERO) */}
                    <div className="flex flex-col items-center justify-center py-2 relative z-10">
                      <span className={`text-6xl font-black tracking-tighter ${marginType === 'safe' ? 'text-teal-400 drop-shadow-[0_0_15px_rgba(45,212,191,0.3)]' :
                        marginType === 'warning' ? 'text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]' :
                          'text-rose-400 drop-shadow-[0_0_15px_rgba(251,113,133,0.3)]'
                        }`}>
                        {marginValue}
                      </span>
                      <span className={`text-xs font-bold uppercase tracking-widest mt-1 ${marginType === 'safe' ? 'text-teal-500/80' :
                        marginType === 'warning' ? 'text-amber-500/80' :
                          'text-rose-500/80'
                        }`}>
                        {marginLabel}
                      </span>
                    </div>

                    {/* Footer: Stats */}
                    <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-2 text-xs relative z-10">
                      <div className="flex flex-col items-center p-1.5 rounded-lg bg-black/20">
                        <span className="text-gray-500 uppercase text-[8px] tracking-wider mb-0.5">Attend%</span>
                        <span className={`font-bold ${getAttendanceColor(percentage)}`}>{percentage.toFixed(0)}%</span>
                      </div>
                      <div className="flex flex-col items-center p-1.5 rounded-lg bg-black/20">
                        <span className="text-gray-500 uppercase text-[8px] tracking-wider mb-0.5">Done</span>
                        <span className="text-gray-300 font-bold">{conducted}</span>
                      </div>
                      <div className="flex flex-col items-center p-1.5 rounded-lg bg-black/20">
                        <span className="text-gray-500 uppercase text-[8px] tracking-wider mb-0.5">Missed</span>
                        <span className={`font-bold ${absent > 0 ? 'text-amber-300' : 'text-gray-300'}`}>
                          {absent}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Overall Attendance */}
        <div className="glass-card relative overflow-hidden rounded-2xl p-6 group transition-all duration-300 hover:bg-slate-900/60 hover:border-white/10">
          <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${getAttendanceColor(attendance.overall_attendance)}`}>
            <BarChartIcon className="w-24 h-24" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Overall Attendance</p>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className={`text-5xl font-black ${getAttendanceColor(attendance.overall_attendance)}`}>
              {attendance.overall_attendance.toFixed(1)}
            </span>
            <span className="text-xl text-gray-400">%</span>
          </div>
          {/* Progress Bar Container */}
          <div className="mt-4 w-full bg-slate-800/50 rounded-full h-2 overflow-hidden shadow-inner border border-white/5 relative z-10">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${getProgressBarColor(attendance.overall_attendance)}`}
              style={{ width: `${attendance.overall_attendance}%` }}
            >
              <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>
        </div>

        {/* Total Hours */}
        <div className="glass-card relative overflow-hidden rounded-2xl p-6 group transition-all duration-300 hover:bg-slate-900/60 hover:border-white/10">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-blue-400">
            <Clock className="w-24 h-24" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Hours Conducted</p>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-5xl font-black text-white group-hover:text-blue-200 transition-colors">
              {attendance.total_hours_conducted}
            </span>
            <span className="text-xl text-gray-500">hrs</span>
          </div>
          <p className="text-xs text-gray-500 mt-2 relative z-10">Total academic hours scheduled</p>
        </div>

        {/* Status */}
        <div className="glass-card relative overflow-hidden rounded-2xl p-6 group transition-all duration-300 hover:bg-slate-900/60 hover:border-white/10">
          <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${getAttendanceColor(attendance.overall_attendance)}`}>
            <UserCheck className="w-24 h-24" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Current Status</p>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className={`text-4xl font-black ${getAttendanceColor(attendance.overall_attendance)}`}>
              {getAttendanceStatus(attendance.overall_attendance)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2 relative z-10">Based on your current percentage</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="glass-card rounded-2xl p-6 border border-white/5 bg-slate-950/40 backdrop-blur-md">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <BarChartIcon className="w-5 h-5 text-blue-500" />
          Attendance Visualizer
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={Object.entries(courses).map(([code, c]: any) => ({
                name: code.replace(/Regular|Arrear/gi, "").trim(),
                Present: (c.hours_conducted || 0) - (c.hours_absent || 0),
                Absent: c.hours_absent || 0,
              }))}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}
                labelStyle={{ color: '#94a3b8', marginBottom: '8px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="Present" stackId="a" fill="#14b8a6" radius={[0, 0, 4, 4]} barSize={30} />
              <Bar dataKey="Absent" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>


    </div>
  );
}