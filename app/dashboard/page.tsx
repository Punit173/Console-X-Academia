// app/dashboard/page.tsx
"use client";

import { useAppData } from "@/components/AppDataContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import { useState } from "react";
import { generateStandardPDF } from "@/utils/pdf-generator";
import autoTable from "jspdf-autotable";

export default function DashboardPage() {
  const { data } = useAppData();
  const [isGenerating, setIsGenerating] = useState(false);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
        <div className="p-6 rounded-full bg-primary/10 mb-4">
          <span className="text-4xl">🔐</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Authentication Required</h2>
        <p className="text-muted-foreground text-sm">Please login from the home page to view your dashboard.</p>
      </div>
    );
  }

  // --- Data Processing ---

  // 1. Attendance Data for Bar Chart
  const attendanceData = Object.entries(data.attendance.attendance.courses).map(([code, c]: any) => ({
    name: code,
    attendance: c.attendance_percentage,
    conducted: c.total_hours_conducted,
    absent: c.total_hours_absent,
    attended: c.total_hours_conducted - c.total_hours_absent,
  }));

  // 2. Marks Data for Area Chart
  const marksData = Object.entries(data.attendance.marks).map(([code, course]: any) => {
    const avg =
      course.tests.length > 0
        ? course.tests.reduce((sum: number, t: any) => sum + t.percentage, 0) / course.tests.length
        : 0;
    return {
      name: code,
      score: parseFloat(avg.toFixed(1)),
    };
  });

  // 3. Credits/Course Type Distribution for Pie Chart
  const courseTypes = data.timetable.courses.reduce((acc: any, curr: any) => {
    const type = curr.course_type || "Other";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(courseTypes).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // 4. Total Marks Calculation
  const totalMarks = Object.values(data.attendance.marks).reduce((acc: any, course: any) => {
    course.tests.forEach((test: any) => {
      acc.obtained += test.obtained_marks || 0;
      acc.max += test.max_marks || 0;
    });
    return acc;
  }, { obtained: 0, max: 0 });

  // Colors
  const COLORS = ["#FF5500", "#3B82F6", "#10B981", "#F59E0B"];
  const RADIAN = Math.PI / 180;
  
  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/90 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
          <p className="text-white font-bold text-sm mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: <span className="font-mono font-bold">{entry.value}</span>
              {entry.unit || ""}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const formatXAxis = (tickItem: string) => {
    // Remove common suffixes to save space
    const clean = tickItem.replace(/Theory|Practical/gi, "");
    return clean.length > 9 ? `${clean.substring(0, 9)}..` : clean;
  };

  // --- PDF Generation ---
  const handleExport = (action: 'download' | 'share') => {
    setIsGenerating(true);
    generateStandardPDF(
      "Comprehensive Report",
      data,
      (doc, formatNumber) => {
        let currentY = 65;

        // -- Summary Stats --
        doc.setFontSize(12);
        doc.setTextColor(255, 85, 0); // Primary color
        doc.text("Overview Statistics", 14, currentY);
        currentY += 8;

        autoTable(doc, {
          startY: currentY,
          head: [['Total Credits', 'Overall Attendance', 'Total Courses', 'Total Marks']],
          body: [[
             `${data.timetable.total_credits}`,
             `${data.attendance.attendance.overall_attendance.toFixed(1)}%`,
             `${data.timetable.courses.length}`,
             `${totalMarks.obtained.toFixed(2)} / ${totalMarks.max.toFixed(2)}`
          ]],
          theme: 'grid',
          styles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], lineColor: [40, 40, 40] },
          headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255] },
        });

        // @ts-ignore
        currentY = doc.lastAutoTable.finalY + 15;

        // -- Attendance Table --
        doc.setFontSize(12);
        doc.setTextColor(255, 85, 0);
        doc.text("Attendance Summary", 14, currentY);
        currentY += 8;

        const attendanceRows = Object.entries(data.attendance.attendance.courses).map(([code, c]: any) => [
          code,
          c.total_hours_conducted,
          c.total_hours_absent,
          `${c.attendance_percentage.toFixed(1)}%`
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [['Course Code', 'Conducted', 'Absent', 'Percentage']],
          body: attendanceRows,
          theme: 'grid',
          styles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], lineColor: [40, 40, 40] },
          headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255] },
        });

        // @ts-ignore
        currentY = doc.lastAutoTable.finalY + 15;

        // -- Marks Summary --
        // Check if we need a new page
        // @ts-ignore
        if (currentY + 20 > doc.internal.pageSize.height) {
           doc.addPage();
           // Re-apply black background to new page
           doc.setFillColor(0, 0, 0); 
           doc.rect(0, 0, doc.internal.pageSize.width, doc.internal.pageSize.height, 'F');
           currentY = 20;
        }

        doc.setFontSize(12);
        doc.setTextColor(255, 85, 0);
        doc.text("Marks Summary", 14, currentY);
        currentY += 8;

        const marksRows = Object.entries(data.attendance.marks).map(([code, course]: any) => {
            const totObt = course.tests.reduce((s: number, t: any) => s + (t.obtained_marks||0), 0);
            const totMax = course.tests.reduce((s: number, t: any) => s + (t.max_marks||0), 0);
            return [
                code,
                course.tests.length,
                `${formatNumber(totObt)} / ${formatNumber(totMax)}`
            ];
        });

        autoTable(doc, {
          startY: currentY,
          head: [['Course Code', 'Assessments Count', 'Total Scored']],
          body: marksRows,
          theme: 'grid',
          styles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], lineColor: [40, 40, 40] },
          headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255] },
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
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">
            Visual insights into your academic performance and attendance.
          </p>
        </div>

         {/* Actions */}
         <div className="flex items-center gap-3">
           {/* Share Button */}
           <button
            onClick={() => handleExport('share')}
            disabled={isGenerating}
            className="p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-green-500/50 transition-all duration-200 group text-green-400 disabled:opacity-50"
            title="Share Summary PDF"
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
            title="Download Summary PDF"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Attendance Bar Chart */}
        <div className="glass-card rounded-xl p-6 lg:col-span-2">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-1 h-5 bg-primary rounded-full"></span>
            Attendance Overview
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#718096" 
                  tick={{ fill: '#718096', fontSize: 11 }} 
                  tickFormatter={formatXAxis}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#718096" 
                  tick={{ fill: '#718096', fontSize: 12 }} 
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar 
                  dataKey="attendance" 
                  name="Attendance %" 
                  fill="url(#colorAttendance)" 
                  radius={[4, 4, 0, 0]} 
                  barSize={40}
                >
                    {attendanceData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.attendance >= 75 ? '#10B981' : entry.attendance >= 65 ? '#F59E0B' : '#EF4444'} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Marks Performance Area Chart */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
            Performance Trends
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={marksData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#718096" 
                  tick={{ fill: '#718096', fontSize: 10 }} 
                  tickFormatter={formatXAxis}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#718096" 
                  tick={{ fill: '#718096', fontSize: 12 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  name="Avg Score" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Course Distribution Pie Chart */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-1 h-5 bg-orange-500 rounded-full"></span>
            Course Distribution
          </h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.2)" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="glass-card rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Credits</p>
                <p className="text-2xl font-bold text-white mt-1">{data.timetable.total_credits}</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg Attendance</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{data.attendance.attendance.overall_attendance.toFixed(1)}%</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Courses</p>
                <p className="text-2xl font-bold text-blue-400 mt-1">{data.timetable.courses.length}</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Assessments</p>
                <p className="text-2xl font-bold text-orange-400 mt-1">
                    {Object.values(data.attendance.marks).reduce((acc: number, curr: any) => acc + curr.tests.length, 0)}
                </p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center col-span-2 md:col-span-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Marks</p>
                <p className="text-lg font-bold text-purple-400 mt-1">
                    {totalMarks.obtained.toFixed(2)} <span className="text-muted-foreground text-sm">/ {totalMarks.max.toFixed(2)}</span>
                </p>
            </div>
        </div>

      </div>
    </div>
  );
}
