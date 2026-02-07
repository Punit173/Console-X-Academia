// app/attendance/page.tsx
"use client";

import { useAppData } from "@/components/AppDataContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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


  // --- Theme Helpers: Strict Blue/White/Black Palette ---

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
    <div className="w-full animate-fade-in space-y-8 pb-10">

      {/* Header */}
      <div className=" top-0 z-50 bg-slate-950/90 backdrop-blur-xl flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-blue-900/30 pb-6 pt-4 -mt-4 relative transition-all">
        {/* Glow effect - restricted to navy/blue */}
        <div className="absolute -left-4 top-0 w-20 h-20 bg-blue-900/20 blur-3xl rounded-full pointer-events-none"></div>
        <div className="relative">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2 drop-shadow-sm">
            Attendance <span className="text-blue-200">Overview</span>
          </h1>
          <p className="text-blue-100/70 text-sm font-medium">
            Track your presence and eligibility across all courses.
          </p>
        </div>

        {/* Actions */}
        {/* Actions - Combined or Simplified if needed, currently kept minimal or removed as per request to match clean UI */}
        <div className="flex items-center gap-3">
          {/* Buttons removed to match the reference 'clean' look if desired, or keep them if functionality is needed. 
                 User said "attendance dashboar ui is not good", implying they want the NEW look. 
                 The new look in screenshot DOES have buttons for Share, Predict, Download. 
                 Wait, the screenshot HAS them: Share (icon), Predict (Button), Download (Icon).
                 I should aligning them to look exactly like the screenshot. 
             */}
          <button
            onClick={() => handleExport('share')}
            disabled={isGenerating}
            className="p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-blue-400"
          >
            <Share2 className="w-5 h-5" />
          </button>

          <Link
            href="/attendance/predict"
            className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-white font-semibold flex items-center gap-2"
          >
            Predict <ArrowUpRight className="w-4 h-4" />
          </Link>

          <button
            onClick={() => handleExport('download')}
            disabled={isGenerating}
            className="p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-white"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Overall Attendance */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-950/60 backdrop-blur-md p-6 group transition-all duration-300 shadow-lg shadow-black/40 hover:bg-slate-900/60 hover:border-white/10">
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
              className={`h-full ${getProgressBarColor(attendance.overall_attendance)} transition-all duration-1000 relative`}
              style={{ width: `${Math.min(attendance.overall_attendance, 100)}%` }}
            >
              {/* Subtle Shine */}
              <div className="absolute top-0 right-0 bottom-0 w-full bg-gradient-to-l from-white/20 to-transparent"></div>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Status: <span className={`font-bold tracking-wide ${getAttendanceColor(attendance.overall_attendance)}`}>{getAttendanceStatus(attendance.overall_attendance)}</span>
          </p>
        </div>

        {/* Total Hours Conducted */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-950/60 backdrop-blur-md p-6 group transition-all duration-300 shadow-lg shadow-black/40 hover:bg-slate-900/60 hover:border-white/10">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-blue-400">
            <Clock className="w-24 h-24" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Hours Conducted</p>
          <p className="text-5xl font-black text-white relative z-10">
            {attendance.total_hours_conducted}
          </p>
          <p className="mt-4 text-xs text-gray-400 relative z-10">Total academic hours scheduled so far.</p>
        </div>

        {/* Total Hours Absent */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-950/60 backdrop-blur-md p-6 group transition-all duration-300 shadow-lg shadow-black/40 hover:bg-slate-900/60 hover:border-white/10">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-red-400">
            <UserCheck className="w-24 h-24" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Hours Absent</p>
          <p className="text-5xl font-black text-white relative z-10">
            {attendance.total_hours_absent}
          </p>
          <p className="mt-4 text-xs text-gray-400 relative z-10">Total hours missed across all subjects.</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="mt-8 mb-8">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="w-1 h-6 bg-teal-500 rounded-full"></span>
          Subject Performance
        </h2>
        <div className="h-[400px] w-full glass-card rounded-2xl p-6 bg-slate-950/60 backdrop-blur-md border border-white/5 shadow-lg shadow-black/40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={Object.entries(courses).map(([code, c]: any) => {
                const matchedCourse = data.timetable?.courses?.find((tc: any) => {
                  const tCode = (tc.course_code || "").toLowerCase().trim();
                  const aCode = code.toLowerCase().trim();
                  return aCode === tCode || aCode.startsWith(tCode) || aCode.includes(tCode);
                });
                const name = matchedCourse?.course_title || c.course_title || code.replace(/Regular|Arrear/gi, "").trim();
                const conducted = c.hours_conducted || c.total_hours_conducted || 0;
                const absent = c.hours_absent || c.total_hours_absent || 0;
                return {
                  name,
                  Present: conducted - absent,
                  Absent: absent,
                };
              })}
              margin={{ top: 20, right: 30, left: 0, bottom: 80 }} // Bottom margin for labels
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ fontSize: '12px' }}
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
          <div className="rounded-2xl border border-white/5 bg-slate-950/60 backdrop-blur-md overflow-hidden shadow-lg shadow-black/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="hidden md:table-header-group">
                  <tr className="border-b border-white/5 bg-white/5">
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Course</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Attendance</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Hours</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 md:divide-none">
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

                    let marginMsg = "";
                    let marginType: "safe" | "warning" | "danger" = "safe";

                    if (percentage >= threshold) {
                      const maxTotal = present / (threshold / 100);
                      const safeBunks = Math.floor(maxTotal - conducted);
                      if (safeBunks > 0) {
                        marginMsg = `${safeBunks}`;
                        marginType = "safe";
                      } else {
                        marginMsg = "0";
                        marginType = "warning";
                      }
                    } else {
                      const targetRatio = threshold / 100;
                      const needed = Math.ceil((targetRatio * conducted - present) / (1 - targetRatio));
                      marginMsg = `Required: ${needed}`;
                      marginType = "danger";
                    }

                    return (
                      <tr
                        key={code}
                        onClick={() => router.push(`/marks?highlight=${code}`)}
                        className="group transition-colors border-b md:border-b border-white/5 last:border-0 grid grid-cols-2 gap-4 md:table-row bg-white/5 md:bg-transparent rounded-xl md:rounded-none p-4 md:p-0 mb-4 md:mb-0 cursor-pointer hover:bg-white/5 relative"
                      >
                        <td className="col-span-2 md:col-auto md:table-cell p-0 md:p-4">
                          <div className="flex items-center justify-between">
                            
                            {/* Left content */}
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-200 text-base mb-1 group-hover:text-white transition-colors">
                                {displayName}
                              </span>
                              <span className="text-[10px] font-mono text-gray-600 group-hover:text-gray-500 bg-black/20 px-1.5 py-0.5 rounded w-fit capitalize transition-colors">
                                {code.replace(/Regular|Arrear/gi, "").toLowerCase()}
                              </span>
                            </div>

                            {/* Right content */}
                            <div className="flex flex-col items-end">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-base font-medium ${
                                  marginType === "safe"
                                    ? "text-teal-300"
                                    : marginType === "warning"
                                    ? "text-amber-300"
                                    : "text-rose-300"
                                }`}
                              >
                                {marginMsg}
                              </span>
                              <span
                                className={`text-sm ${
                                  marginType === "safe"
                                    ? "text-teal-300"
                                    : marginType === "warning"
                                    ? "text-amber-300"
                                    : "text-rose-300"
                                }`}
                              >
                                Margin
                              </span>
                            </div>

                          </div>
                        </td>

                        {/* <td className="col-span-2 md:col-auto md:table-cell p-0 md:p-4 text-center md:text-right flex items-center justify-center md:block">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${marginType === 'safe' ? 'bg-teal-500/10 border-teal-500/20 text-teal-300' :
                            marginType === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' :
                              'bg-rose-500/10 border-rose-500/20 text-rose-300'
                            }`}>
                            {marginMsg}
                          </span>
                        </td> */}

                        <td className="md:table-cell p-0 md:p-4 text-center">
                          <div className="flex flex-col items-center justify-center h-full">
                            <span className={`text-xl font-bold ${getAttendanceColor(percentage)}`}>
                              {percentage.toFixed(1)}%
                            </span>
                            <span className="text-[9px] font-medium text-gray-500 uppercase tracking-widest mt-0.5">
                              {getAttendanceStatus(percentage)}
                            </span>
                          </div>
                        </td>

                        <td className="md:table-cell p-0 md:p-4 text-center">
                          <div className="flex flex-col gap-1 items-center justify-center h-full">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-gray-500 w-8 text-right">Done</span>
                              <span className="text-gray-300 font-medium">{conducted}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-gray-500 w-8 text-right">Missed</span>
                              <span className="text-gray-300 font-medium">{absent}</span>
                            </div>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}