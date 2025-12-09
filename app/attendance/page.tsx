// app/attendance/page.tsx
"use client";

import { useAppData } from "@/components/AppDataContext";
import { useState } from "react";
import { generateStandardPDF } from "@/utils/pdf-generator";
import autoTable from "jspdf-autotable";


export default function AttendancePage() {
  const { data: apiData } = useAppData();
  const data = apiData;

  const [isGenerating, setIsGenerating] = useState(false);

  // --- Theme Helpers: Strict Blue/White/Black Palette ---

  const getAttendanceColor = (percentage: number) => {
    // High: Pure White (Glowing)
    if (percentage >= 80) return "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]";
    // Mid: Light Blue
    if (percentage >= 75) return "text-blue-300 drop-shadow-[0_0_8px_rgba(147,197,253,0.3)]";
    // Low: Mid/Dark Blue (Dimmed)
    return "text-blue-600";
  };
  
  const getProgressBarColor = (percentage: number) => {
    // High: White Bar
    if (percentage >= 80) return "bg-white shadow-[0_0_10px_rgba(255,255,255,0.4)]";
    // Mid: Light Blue Bar
    if (percentage >= 75) return "bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.3)]";
    // Low: Navy Blue Bar
    return "bg-blue-800";
  };

  const getAttendanceStatus = (percentage: number) => {
    if (percentage >= 80) return "Excellent";
    if (percentage >= 75) return "Good";
    if (percentage >= 70) return "Average";
    return "Low";
  };

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in bg-black">
        <div className="p-6 rounded-full bg-blue-950/30 border border-blue-800/50 mb-4 shadow-[0_0_15px_rgba(30,58,138,0.2)]">
          <span className="text-4xl text-white">🔐</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Authentication Required</h2>
        <p className="text-blue-300/60 text-sm">Please login from the home page to view your attendance.</p>
      </div>
    );
  }

  const attendance = data.attendance.attendance;
  const courses = attendance.courses as any;

  const handleExport = (action: 'download' | 'share') => {
    setIsGenerating(true);
    generateStandardPDF(
      "Attendance Report",
      data,
      (doc, formatNumber) => {
        // Attendance Table
        const tableRows = Object.entries(courses).map(([code, c]: any) => [
          `${code} - ${c.course_title || ''}`,
          `${c.total_hours_conducted}`,
          `${c.total_hours_absent}`,
          `${c.attendance_percentage.toFixed(1)}%`,
          getAttendanceStatus(c.attendance_percentage)
        ]);

        autoTable(doc, {
          startY: 65,
          head: [['Course', 'Conducted', 'Absent', 'Percentage', 'Status']],
          body: tableRows,
          theme: 'grid',
          styles: {
            fillColor: [2, 6, 23], // Slate 950 (Black-ish)
            textColor: [255, 255, 255],
            lineColor: [30, 58, 138], // Blue 800
            lineWidth: 0.1,
          },
          headStyles: {
            fillColor: [23, 37, 84], // Blue 950
            textColor: [147, 197, 253], // Blue 300
            fontStyle: 'bold',
            lineColor: [30, 58, 138], 
          },
          alternateRowStyles: {
            fillColor: [15, 23, 42], // Slate 900
          },
        });
      },
      action,
      () => setIsGenerating(false),
      () => setIsGenerating(false)
    );
  };

  return (
    <div className="w-full animate-fade-in space-y-8 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-blue-900/30 pb-6 relative">
        {/* Glow effect - restricted to navy/blue */}
        <div className="absolute -left-4 top-0 w-20 h-20 bg-blue-900/20 blur-3xl rounded-full pointer-events-none"></div>
        <div className="relative">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2 drop-shadow-sm">
            Attendance <span className="text-blue-300">Overview</span>
          </h1>
          <p className="text-blue-200/50 text-sm font-medium">
            Track your presence and eligibility across all courses.
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-3">
           {/* Share Button */}
           <button
            onClick={() => handleExport('share')}
            disabled={isGenerating}
            className="p-3 rounded-xl border border-blue-800/40 bg-blue-950/20 hover:bg-blue-900/40 hover:border-blue-400/50 transition-all duration-200 group text-blue-300 disabled:opacity-50 backdrop-blur-sm"
            title="Share PDF"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>

          {/* Export PDF Button */}
          <button
            onClick={() => handleExport('download')}
            disabled={isGenerating}
            className="p-3 rounded-xl border border-blue-800/40 bg-blue-950/20 hover:bg-blue-900/40 hover:border-white/50 transition-all duration-200 group text-white disabled:opacity-50 backdrop-blur-sm"
            title="Download PDF"
          >
             {isGenerating ? (
               <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
            ) : (
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
            )}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Overall Attendance */}
        <div className="relative overflow-hidden rounded-2xl border border-blue-900/40 bg-blue-500 p-6 group hover:border-blue-500/30 transition-colors duration-300 shadow-lg shadow-black/40">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-white">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
          </div>
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-4">Overall Attendance</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-5xl font-bold ${getAttendanceColor(attendance.overall_attendance)}`}>
              {attendance.overall_attendance.toFixed(1)}
            </span>
            <span className="text-xl text-blue-500/60">%</span>
          </div>
          {/* Progress Bar Container: Dark Navy */}
          <div className="mt-4 w-full bg-blue-950 rounded-full h-2 overflow-hidden shadow-inner border border-blue-900/30">
            <div
              className={`h-full ${getProgressBarColor(attendance.overall_attendance)} transition-all duration-1000 relative`}
              style={{ width: `${Math.min(attendance.overall_attendance, 100)}%` }}
            >
                {/* Subtle Shine */}
                <div className="absolute top-0 right-0 bottom-0 w-full bg-gradient-to-l from-white/10 to-transparent"></div>
            </div>
          </div>
          <p className="mt-2 text-xs text-blue-300/50">
            Status: <span className="text-white font-medium tracking-wide">{getAttendanceStatus(attendance.overall_attendance)}</span>
          </p>
        </div>

        {/* Total Hours Conducted */}
        <div className="relative overflow-hidden rounded-2xl border border-blue-900/40 bg-blue-500 backdrop-blur-md p-6 group hover:border-blue-500/30 transition-colors duration-300 shadow-lg shadow-black/40">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-blue-300">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
          </div>
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-4">Hours Conducted</p>
          <p className="text-5xl font-bold text-white">
            {attendance.total_hours_conducted}
          </p>
          <p className="mt-4 text-xs text-blue-300/50">Total academic hours scheduled so far.</p>
        </div>

        {/* Total Hours Absent */}
        <div className="relative overflow-hidden rounded-2xl border border-blue-900/40 bg-blue-500 backdrop-blur-md p-6 group hover:border-blue-400/30 transition-colors duration-300 shadow-lg shadow-black/40">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-blue-500">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
          </div>
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-4">Hours Absent</p>
          {/* Changed from Red to Blue-300 to match strict palette */}
          <p className="text-5xl font-bold text-blue-300 drop-shadow-[0_0_10px_rgba(147,197,253,0.3)]">
            {attendance.total_hours_absent}
          </p>
          <p className="mt-4 text-xs text-blue-300/50">Total hours missed across all subjects.</p>
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
            <p className="text-blue-300/50">No course attendance data available.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {Object.entries(courses).map(([code, c]: any, index) => (
              <div
                key={code}
                className="relative rounded-xl p-5 border border-blue-900/30 bg-slate-950/60 hover:bg-blue-950/30 hover:border-blue-500/40 transition-all duration-300 flex flex-col sm:flex-row sm:items-center gap-6 group overflow-hidden"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Subtle White/Blue Glow on Hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Course Info */}
                <div className="flex-1 min-w-0 relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold text-blue-200 bg-blue-950/80 border border-blue-800 px-2 py-0.5 rounded shadow-sm">
                      {code}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-lg truncate group-hover:text-blue-100 transition-colors">
                    {c.course_title || code}
                  </h3>
                  <div className="flex gap-4 mt-2 text-xs text-blue-300/60">
                    <span className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                        <strong className="text-white">{c.total_hours_conducted}</strong> Conducted
                    </span>
                    <span className="flex items-center gap-1">
                        {/* Absent indicator uses darker blue */}
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                        <strong className="text-blue-400">{c.total_hours_absent}</strong> Absent
                    </span>
                  </div>
                </div>

                {/* Percentage & Bar */}
                <div className="flex-shrink-0 w-full sm:w-48 flex flex-col items-end relative z-10">
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className={`text-2xl font-bold ${getAttendanceColor(c.attendance_percentage)}`}>
                      {c.attendance_percentage.toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-blue-500/80 font-bold uppercase tracking-wider">{getAttendanceStatus(c.attendance_percentage)}</span>
                  </div>
                  <div className="w-full bg-blue-950 rounded-full h-1.5 overflow-hidden shadow-inner border border-white/5">
                    <div
                      className={`h-full ${getProgressBarColor(c.attendance_percentage)} transition-all duration-1000`}
                      style={{ width: `${Math.min(c.attendance_percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}