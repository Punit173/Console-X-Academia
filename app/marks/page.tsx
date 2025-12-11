// app/marks/page.tsx
"use client";

import { useAppData } from "@/components/AppDataContext";
import type { jsPDF } from "jspdf";

import { useState } from "react";
import logo from "../../public/assets/logo.jpg";
import {
  AreaChart,
  Area,
  Tooltip,
  ResponsiveContainer,
  YAxis
} from "recharts";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MarksPage() {
  const router = useRouter();
  const { data, refreshData, isLoading } = useAppData();

  useEffect(() => {
    if (!data) {
      router.push("/");
    }
  }, [data, router]);

  const [isGenerating, setIsGenerating] = useState(false);


  // Simple color variants
  const getPerformanceTextColor = (percentage: number) => {
    if (percentage >= 80) return "text-[#62D834]";
    if (percentage >= 60) return "text-[#62D834]/80";
    return "text-[#62D834]/60";
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 80) return "bg-[#62D834]";
    if (percentage >= 60) return "bg-[#62D834]/80";
    return "bg-[#62D834]/60";
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
        <p className="text-white/40 text-center max-w-md">
          Please login from the home page to view your marks.
        </p>
      </div>
    );
  }

  const marks = data.attendance?.marks || {};
  const timetableCourses = data.timetable?.courses || [];


  const getCourseTitle = (marksCode: string) => {
    const normalizedCode = marksCode
      .replace(/Theory$/i, "")
      .replace(/Practical$/i, "")
      .trim();

    const course = timetableCourses.find(
      (t) => t.course_code.trim().toLowerCase() === normalizedCode.toLowerCase()
    );

    return course?.course_title || marksCode;
  };

  const formatNumber = (value: number) => value.toFixed(2);

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
            styles: {
              fillColor: [98, 216, 52],
              textColor: [0, 0, 0],
              fontStyle: "bold",
            },
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
        styles: {
          fillColor: [10, 10, 10],
          textColor: [255, 255, 255],
          lineColor: [98, 216, 52],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [30, 30, 30],
          textColor: [98, 216, 52],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [0, 0, 0],
        },
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
          alert("Sharing is not supported on this device. The file will be downloaded.");
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

  return (
    <div className="w-full pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Performance Overview Card */}
        <div className="rounded-3xl bg-[#62D834] p-4 sm:p-6 lg:p-8 shadow-xl text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-8">
            {/* Student Info */}
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

            {/* Stats Grid */}
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

          {/* Action Buttons */}
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
                onClick={refreshData}
                disabled={isLoading || isGenerating}
                className={`p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all flex items-center justify-center ${isLoading ? "animate-spin" : ""
                  }`}
                title="Refresh Data"
              >
                <svg
                  className="w-5 h-5"
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                className="bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden hover:border-[#62D834]/30 transition-all duration-300"
              >
                {/* Header */}
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

                  {/* Mini Chart */}
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

                {/* Assessments List */}
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