// app/attendance/page.tsx
"use client";

import { useAppData } from "@/components/AppDataContext";
import { useState } from "react";
import { generateStandardPDF } from "@/utils/pdf-generator";
import autoTable from "jspdf-autotable";

export default function AttendancePage() {
  const { data } = useAppData();
  const [isGenerating, setIsGenerating] = useState(false);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
        <div className="p-6 rounded-full bg-primary/10 mb-4">
          <span className="text-4xl">🔐</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Authentication Required</h2>
        <p className="text-muted-foreground text-sm">Please login from the home page to view your attendance.</p>
      </div>
    );
  }

  const attendance = data.attendance.attendance;
  const courses = attendance.courses as any;

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 80) return "text-emerald-400";
    if (percentage >= 75) return "text-blue-400";
    if (percentage >= 70) return "text-amber-400";
    return "text-red-400";
  };
  
  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 80) return "bg-emerald-500";
    if (percentage >= 75) return "bg-blue-500";
    if (percentage >= 70) return "bg-amber-500";
    return "bg-red-500";
  };

  const getAttendanceStatus = (percentage: number) => {
    if (percentage >= 80) return "Excellent";
    if (percentage >= 75) return "Good";
    if (percentage >= 70) return "At Risk";
    return "Critical";
  };

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
            fillColor: [0, 0, 0],
            textColor: [255, 255, 255],
            lineColor: [40, 40, 40],
            lineWidth: 0.1,
          },
          headStyles: {
            fillColor: [255, 85, 0], // Primary Orange
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          alternateRowStyles: {
            fillColor: [10, 10, 10],
          },
        });
      },
      action,
      () => setIsGenerating(false),
      () => setIsGenerating(false)
    );
  };

  return (
    <div className="w-full animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
            Attendance Overview
          </h1>
          <p className="text-muted-foreground text-sm">
            Track your presence and eligibility across all courses.
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-3">
           {/* Share Button */}
           <button
            onClick={() => handleExport('share')}
            disabled={isGenerating}
            className="p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-green-500/50 transition-all duration-200 group text-green-400 disabled:opacity-50"
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
            className="p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all duration-200 group text-gray-400 hover:text-primary disabled:opacity-50"
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
        <div className="glass-card rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
          </div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Overall Attendance</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-5xl font-bold ${getAttendanceColor(attendance.overall_attendance)}`}>
              {attendance.overall_attendance.toFixed(1)}
            </span>
            <span className="text-xl text-muted-foreground">%</span>
          </div>
          <div className="mt-4 w-full bg-black/40 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full ${getProgressBarColor(attendance.overall_attendance)} transition-all duration-1000`}
              style={{ width: `${Math.min(attendance.overall_attendance, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Status: <span className="text-white font-medium">{getAttendanceStatus(attendance.overall_attendance)}</span>
          </p>
        </div>

        {/* Total Hours Conducted */}
        <div className="glass-card rounded-xl p-6 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
          </div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Hours Conducted</p>
          <p className="text-5xl font-bold text-white">
            {attendance.total_hours_conducted}
          </p>
          <p className="mt-4 text-xs text-muted-foreground">Total academic hours scheduled so far.</p>
        </div>

        {/* Total Hours Absent */}
        <div className="glass-card rounded-xl p-6 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
          </div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Hours Absent</p>
          <p className="text-5xl font-bold text-red-400">
            {attendance.total_hours_absent}
          </p>
          <p className="mt-4 text-xs text-muted-foreground">Total hours missed across all subjects.</p>
        </div>
      </div>

      {/* Per-Course Attendance */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="w-1 h-6 bg-primary rounded-full"></span>
          Course Breakdown
        </h2>
        
        {Object.keys(courses).length === 0 ? (
          <div className="text-center py-12 glass-card rounded-xl">
            <p className="text-muted-foreground">No course attendance data available.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {Object.entries(courses).map(([code, c]: any, index) => (
              <div
                key={code}
                className="glass-card rounded-xl p-5 hover:border-primary/30 transition-all duration-300 flex flex-col sm:flex-row sm:items-center gap-6"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Course Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      {code}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-lg truncate">
                    {c.course_title || code}
                  </h3>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span><strong className="text-white">{c.total_hours_conducted}</strong> Conducted</span>
                    <span><strong className="text-red-400">{c.total_hours_absent}</strong> Absent</span>
                  </div>
                </div>

                {/* Percentage & Bar */}
                <div className="flex-shrink-0 w-full sm:w-48 flex flex-col items-end">
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className={`text-2xl font-bold ${getAttendanceColor(c.attendance_percentage)}`}>
                      {c.attendance_percentage.toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground font-medium uppercase">{getAttendanceStatus(c.attendance_percentage)}</span>
                  </div>
                  <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden">
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
