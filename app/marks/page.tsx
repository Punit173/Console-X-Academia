// app/marks/page.tsx
"use client";

import { useAppData } from "@/components/AppDataContext";
import { useState, useEffect } from "react";
import logo from "../../public/assets/logo.jpg";
import {
  AreaChart,
  Area,
  Tooltip,
  ResponsiveContainer,
  YAxis
} from "recharts";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Calculator, AlertTriangle, ArrowLeft } from "lucide-react";

// --- Predictor Types & Constants ---
type Grade = 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C';

const GRADE_THRESHOLDS: Record<Grade, number> = {
  'O': 91,
  'A+': 81,
  'A': 71,
  'B+': 61,
  'B': 56,
  'C': 50,
};

const GRADES = Object.keys(GRADE_THRESHOLDS) as Grade[];

import { Suspense } from "react";

function MarksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightCode = searchParams ? searchParams.get('highlight') : null;


  const { data, refreshData, isLoading } = useAppData();

  // Scroll to highlighted element
  useEffect(() => {
    if (highlightCode) {
      const element = document.getElementById(highlightCode);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-2', 'ring-[#62D834]', 'ring-offset-2', 'ring-offset-black');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-[#62D834]', 'ring-offset-2', 'ring-offset-black');
          }, 2000);
        }, 500);
      }
    }
  }, [highlightCode, isLoading]); // Re-run when loading finishes

  // --- Main Page State ---
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPredictor, setShowPredictor] = useState(false);

  // --- Predictor State ---
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    if (!data) {
      router.push("/");
      return;
    }

    // Initialize Predictor Data
    if (data.attendance?.marks) {
      const loadedCourses = Object.entries(data.attendance.marks)
        // @ts-ignore
        .filter(([_, c]: any) => c.course_type === 'Theory')
        .map(([code, c]: any) => {
          // Calculate initial internal marks
          // @ts-ignore
          const currentInternal = c.tests.reduce((sum: number, t: any) => sum + (t.obtained_marks || 0), 0);

          // Get clean title
          const courseInfo = data.timetable?.courses?.find((tc: any) => tc.course_code === code);
          const title = courseInfo?.course_title || code.replace(/Theory|Practical/gi, "").trim();

          return {
            id: code,
            code: code.replace(/Theory|Practical/gi, "").trim(),
            title: title,
            internalMarks: Math.min(currentInternal, 60), // Cap at 60
            targetGrade: 'O' as Grade
          };
        });
      setCourses(loadedCourses);
    }
  }, [data, router]);

  // --- Predictor Helpers ---
  const updateCourse = (id: string, field: string, value: any) => {
    setCourses(prev => prev.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const calculateRequired = (internal: number, target: Grade) => {
    const threshold = GRADE_THRESHOLDS[target];
    const needed = (threshold - internal) * (75 / 40);
    return Math.max(0, needed);
  };

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 bg-black">
        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 mb-6">
          <span className="text-5xl">🔐</span>
        </div>
        <h2 className="text-2xl font-semibold text-white mb-3">
          Authentication Required
        </h2>
        <p className="text-white/40 text-center max-w-md mb-6">
          Please login from the home page to view your marks.
        </p>
        <Link
          href="/"
          className="px-8 py-3 bg-[#62D834] hover:bg-[#50b328] text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(98,216,52,0.3)] hover:shadow-[0_0_30px_rgba(98,216,52,0.5)] active:scale-95"
        >
          Login to Continue
        </Link>
      </div>
    );
  }

  // --- Marks Page Helpers ---
  const marks = data.attendance?.marks || {};
  const timetableCourses = data.timetable?.courses || [];

  const getCourseTitle = (marksCode: string) => {
    const normalizedCode = marksCode
      .replace(/Theory$/i, "")
      .replace(/Practical$/i, "")
      .trim();

    const course = timetableCourses.find(
      (t: any) => t.course_code.trim().toLowerCase() === normalizedCode.toLowerCase()
    );

    return course?.course_title || marksCode;
  };

  const formatNumber = (value: number) => value.toFixed(2);

  const getPerformanceTextColor = (percentage: number) => {
    if (percentage >= 80) return "text-[#62D834]";
    if (percentage >= 60) return "text-[#62D834]/80";
    return "text-[#62D834]/60";
  };

  // Calculate overview stats
  let totalCourses = Object.keys(marks).length;
  let totalAssessments = 0;
  let totalObtainedAll = 0;
  let totalMaxAll = 0;

  Object.values(marks).forEach((course: any) => {
    course.tests.forEach((t: any) => {
      totalAssessments += 1;
      totalObtainedAll += t.obtained_marks ?? 0;
      totalMaxAll += t.max_marks ?? 0;
    });
  });

  const overallPercentage =
    totalMaxAll > 0 ? (totalObtainedAll / totalMaxAll) * 100 : 0;

  // PDF Generation
  const generatePDF = async (action: "download" | "share") => {
    setIsGenerating(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      const drawBackground = () => {
        doc.setFillColor(0, 0, 0);
        doc.rect(0, 0, pageWidth, pageHeight, "F");
      };

      const originalAddPage = doc.addPage;
      doc.addPage = function (...args) {
        const result = originalAddPage.apply(this, args);
        drawBackground();
        return result;
      };

      drawBackground();
      doc.setTextColor(255, 255, 255);

      try {
        const res = await fetch(logo.src);
        const blob = await res.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        doc.addImage(base64, "JPEG", 14, 15, 12, 12);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("CONSOLE X ACADEMIA", 30, 23);
      } catch (err) {
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("CONSOLE X ACADEMIA", 14, 23);
      }

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 200, 200);
      doc.text(`Name: ${data.attendance?.student_info?.name || "Student"}`, 14, 35);
      doc.text(`Reg No: ${data.attendance?.student_info?.registration_number || "N/A"}`, 14, 40);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 45);

      const tableRows: any[] = [];
      Object.entries(marks).forEach(([courseCode, course]) => {
        const subjectName = getCourseTitle(courseCode);

        tableRows.push([
          {
            content: `${courseCode} - ${subjectName}`,
            colSpan: 3,
            styles: { fillColor: [98, 216, 52], textColor: [0, 0, 0], fontStyle: "bold" },
          },
        ]);

        // @ts-ignore
        course.tests.forEach((t: any) => {
          tableRows.push([
            t.test_name,
            `${formatNumber(t.obtained_marks)} / ${formatNumber(t.max_marks)}`,
            `${t.percentage.toFixed(2)}%`,
          ]);
        });
      });

      autoTable(doc, {
        startY: 50,
        head: [["Assessment", "Marks", "Percentage"]],
        body: tableRows,
        theme: "grid",
        styles: { fillColor: [10, 10, 10], textColor: [255, 255, 255], lineColor: [98, 216, 52], lineWidth: 0.1 },
        headStyles: { fillColor: [30, 30, 30], textColor: [98, 216, 52], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [0, 0, 0] },
      });

      if (action === "share") {
        const pdFBlob = doc.output("blob");
        const file = new File([pdFBlob], "academic-report.pdf", { type: "application/pdf" });
        if (navigator.share) {
          await navigator.share({
            files: [file],
            title: "Academic Performance Report",
            text: "Here is my academic performance report from Console X Academia.",
          });
        } else {
          doc.save("academic-report.pdf");
        }
      } else {
        doc.save("academic-report.pdf");
      }
    } catch (error) {
      console.error("PDF Generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-white/20 px-3 py-2 rounded-lg shadow-xl">
          <p className="text-white/60 text-xs mb-0.5">{label}</p>
          <p className="text-[#62D834] text-sm font-semibold">
            {Number(payload[0].value).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  // --- Render Predictor View ---
  if (showPredictor) {
    const totalAchievable = courses.filter(c => calculateRequired(c.internalMarks, c.targetGrade) <= 75).length;

    return (
      <div className="w-full pb-16 animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

          {/* Header Card - Matching Performance Overview */}
          <div className="rounded-3xl bg-[#62D834] p-4 sm:p-6 lg:p-8 shadow-xl text-white">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-8">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3 mb-1">
                  <button
                    onClick={() => setShowPredictor(false)}
                    className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-all"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    Grade Predictor
                  </h1>
                </div>

                <p className="text-white/80 font-medium text-sm sm:text-base max-w-2xl">
                  Adjust your internal marks and set target grades to see exactly what you need in the final exam.
                </p>
              </div>

              <div className="flex gap-3">
                <div className="bg-black/10 rounded-2xl px-4 py-3 text-center min-w-[100px]">
                  <p className="text-xs text-white/70 uppercase tracking-wide mb-1 font-semibold">
                    Predicting
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {courses.length}
                  </p>
                </div>
                <div className="bg-black/10 rounded-2xl px-4 py-3 text-center min-w-[100px]">
                  <p className="text-xs text-white/70 uppercase tracking-wide mb-1 font-semibold">
                    Achievable
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {totalAchievable}
                  </p>
                </div>
              </div>
            </div>

            {/* Info Badge */}
            <div className="mt-6 pt-6 border-t border-white/15 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-white/80 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-white/80">
                Based on <strong>60% Internal + 40% External</strong> weighting.
                Predictions assume standard grading logic.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {courses.map((course) => {
              const required = calculateRequired(course.internalMarks, course.targetGrade);
              const isPossible = required <= 75;

              return (
                <div
                  key={course.id}
                  className="bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden hover:border-[#62D834]/30 transition-all duration-300 flex flex-col"
                >

                  {/* Card Header */}
                  <div className="p-5 border-b border-zinc-800 flex justify-between items-start gap-4">
                    <div>
                      <span className="text-xs font-mono font-bold text-black bg-gray-200 px-2 py-1 rounded mb-2 inline-block">
                        {course.code}
                      </span>
                      <h3 className="font-bold text-lg text-white leading-tight min-h-[3rem] line-clamp-2">
                        {course.title}
                      </h3>
                    </div>
                    <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${isPossible
                      ? "bg-green-500/10 border-green-500/30 text-green-400"
                      : "bg-red-500/10 border-red-500/30 text-red-400"
                      }`}>
                      {isPossible ? "Possible" : "Hard"}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-6 flex-1 flex flex-col">

                    {/* Visual Result */}
                    <div className={`rounded-xl p-4 border ${isPossible ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-xs text-white/50 uppercase tracking-wider font-semibold">Required Stats</span>
                        <span className={`text-2xl font-bold ${isPossible ? "text-[#62D834]" : "text-red-400"}`}>
                          {required.toFixed(0)} <span className="text-sm text-white/30 font-normal">/ 75</span>
                        </span>
                      </div>

                      <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${isPossible ? "bg-[#62D834]" : "bg-red-500"}`}
                          style={{ width: `${Math.min(100, (required / 75) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="space-y-4">

                      {/* Internal Marks Slider */}
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-xs text-white/50 font-bold uppercase">Internals</label>
                          <span className="text-xs font-mono text-white bg-zinc-800 px-1.5 py-0.5 rounded">
                            {course.internalMarks.toFixed(1)} / 60
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="60"
                          step="0.5"
                          value={course.internalMarks}
                          onChange={(e) => updateCourse(course.id, 'internalMarks', parseFloat(e.target.value))}
                          className="w-full accent-[#62D834] h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer hover:bg-zinc-700 transition"
                        />
                      </div>

                      {/* Grade Selector */}
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-xs text-white/50 font-bold uppercase">Target Grade</label>
                          <span className="text-xs font-bold text-[#62D834]">{course.targetGrade}</span>
                        </div>
                        <div className="grid grid-cols-6 gap-1">
                          {GRADES.map(g => (
                            <button
                              key={g}
                              onClick={() => updateCourse(course.id, 'targetGrade', g)}
                              className={`text-[10px] sm:text-xs py-2 rounded-lg transition-all font-bold ${course.targetGrade === g
                                ? "bg-[#62D834] text-black shadow-lg shadow-green-900/20"
                                : "bg-zinc-900 text-white/40 hover:bg-zinc-800 hover:text-white"
                                }`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}
            {courses.length === 0 && (
              <div className="col-span-full text-center py-20 rounded-2xl border-2 border-dashed border-zinc-800">
                <p className="text-white/40 text-lg">
                  No theory courses found to predict.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Render Standard Marks View ---
  return (
    <div className="w-full pb-16 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Performance Overview Card */}
        <div className="rounded-3xl bg-[#62D834] p-4 sm:p-6 lg:p-8 shadow-xl text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-8">
            <div className="flex-1 space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">
                Performance Overview
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-white/80">
                <span className="font-mono bg-white/10 px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold">
                  {data.attendance?.student_info?.registration_number || "N/A"}
                </span>
                <span className="hidden sm:inline text-white/50">•</span>
                <span className="font-medium text-xs sm:text-sm">
                  {data.attendance?.student_info?.name || "Student"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full lg:w-auto">
              {[
                { label: "Courses", val: totalCourses },
                { label: "Assessments", val: totalAssessments },
                { label: "Overall", val: `${formatNumber(overallPercentage)}%` },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-black/10 rounded-2xl px-2 py-3 sm:px-4 sm:py-4 text-center min-w-[80px]"
                >
                  <p className="text-[10px] sm:text-xs text-white/70 uppercase tracking-wide mb-1 font-semibold">
                    {stat.label}
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-white">
                    {stat.val}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-white/15">
            <p className="text-xs sm:text-sm text-white/80 font-medium">
              Current semester report
            </p>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={() => generatePDF("share")}
                disabled={isGenerating || isLoading}
                className="px-4 py-2.5 flex-1 sm:flex-none justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all text-sm font-bold disabled:opacity-50 flex items-center"
              >
                Share
              </button>

              <button
                onClick={() => generatePDF("download")}
                disabled={isGenerating || isLoading}
                className="px-4 py-2.5 flex-1 sm:flex-none justify-center rounded-xl bg-white text-black hover:bg-neutral-100 transition-all text-sm font-bold disabled:opacity-50 whitespace-nowrap"
              >
                {isGenerating ? "Generating..." : "Download PDF"}
              </button>

              <button
                onClick={() => setShowPredictor(true)}
                className="px-4 py-2.5 flex-1 sm:flex-none justify-center rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:opacity-90 transition-all text-sm font-bold flex items-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                Predict
              </button>

              <button
                onClick={refreshData}
                disabled={isLoading || isGenerating}
                className={`p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all flex items-center justify-center 
                  }`}
                title="Refresh Data"
              >
                <svg
                  className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Course Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(marks).map(([courseCode, course], index) => {
            const cleanedCourseCode = courseCode?.replace(/theory/gi, "")?.replace(/practical/gi, "")?.trim();
            // @ts-ignore
            const totalObtained = course.tests.reduce((sum: number, t: any) => sum + (t.obtained_marks ?? 0), 0);
            // @ts-ignore
            const totalMax = course.tests.reduce((sum: number, t: any) => sum + (t.max_marks ?? 0), 0);
            const avgPercentage = course.tests.length > 0 && totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
            const subjectName = getCourseTitle(courseCode);

            // @ts-ignore
            const graphData = course.tests.map((t: any) => ({
              name: t.test_name,
              score: t.percentage
            }));
            if (graphData.length === 1) {
              graphData.unshift({ name: 'Start', score: 0 });
            }

            return (
              <div
                key={courseCode}
                id={courseCode}
                className="bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden hover:border-[#62D834]/30 transition-all duration-300 scroll-mt-24"
              >
                <div className="p-6 border-b border-zinc-800">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold font-mono text-black bg-gray-200 px-2 py-1 rounded">
                          {cleanedCourseCode}
                        </span>
                        <span className="text-xs text-white/40 uppercase tracking-wider">
                          {/* @ts-ignore */}
                          {course.course_type}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg text-white">
                        {subjectName}
                      </h3>
                    </div>

                    <div className="text-right">
                      <span className={`text-3xl font-bold text-white ${getPerformanceTextColor(avgPercentage)}`}>
                        {formatNumber(avgPercentage)}%
                      </span>
                    </div>
                  </div>

                  {graphData.length > 0 && (
                    <div className="h-16 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={graphData}>
                          <defs>
                            <linearGradient id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#62D834" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#62D834" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Tooltip content={<CustomTooltip />} cursor={false} />
                          <Area
                            type="monotone"
                            dataKey="score"
                            stroke="#62D834"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill={`url(#gradient-${index})`}
                          />
                          <YAxis domain={[0, 100]} hide />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-4">
                  {/* @ts-ignore */}
                  {course.tests.length === 0 ? (
                    <p className="text-white/40 text-sm text-center py-4">No assessments yet</p>
                  ) : (
                    // @ts-ignore
                    course.tests.map((t: any) => (
                      <div key={t.test_name} className="space-y-2">
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm text-white/70">{t.test_name}</span>
                          <span className="text-sm font-medium text-white">
                            {formatNumber(t.obtained_marks)} <span className="text-white/30">/</span> {formatNumber(t.max_marks)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {Object.keys(marks).length === 0 && (
          <div className="text-center py-20 rounded-2xl border-2 border-dashed border-zinc-800">
            <p className="text-white/40 text-lg">
              No marks data available for this semester.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MarksPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-t-2 border-[#62D834] rounded-full animate-spin"></div></div>}>
      <MarksContent />
    </Suspense>
  );
}