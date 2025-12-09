// app/marks/page.tsx
"use client";

import { useAppData } from "@/components/AppDataContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useState } from "react";
import logo from "../../public/assets/logo.jpg"; // Importing logo for the PDF

export default function MarksPage() {
  const { data, refreshData, isLoading } = useAppData();
  const [isGenerating, setIsGenerating] = useState(false);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in px-4">
        <div className="p-6 rounded-full bg-primary/10 mb-4">
          <span className="text-4xl">🔐</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2 text-center">
          Authentication Required
        </h2>
        <p className="text-muted-foreground text-sm text-center max-w-sm">
          Please login from the home page to view your marks.
        </p>
      </div>
    );
  }

  const marks = data.attendance.marks;
  const timetableCourses = data.timetable.courses;

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

  // Helper to standard colors (for UI, not PDF)
  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80)
      return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    if (percentage >= 70)
      return "text-blue-400 bg-blue-400/10 border-blue-400/20";
    if (percentage >= 60)
      return "text-amber-400 bg-amber-400/10 border-amber-400/20";
    return "text-red-400 bg-red-400/10 border-red-400/20";
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 80) return "bg-emerald-500";
    if (percentage >= 70) return "bg-blue-500";
    if (percentage >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  // Helper to always show 2 decimal places
  const formatNumber = (value: number) => value.toFixed(2);

  // --- Overview stats ---
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

  const generatePDF = async (action: "download" | "share") => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      // --- 1. Dark Theme Background ---
      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      // Set default text color to white
      doc.setTextColor(255, 255, 255);

      // --- 2. Logo & Branding ---
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

      // --- 3. Student Details ---
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 200, 200);
      doc.text(`Name: ${data.attendance.student_info.name}`, 14, 35);
      doc.text(
        `Reg No: ${data.attendance.student_info.registration_number}`,
        14,
        40
      );
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 45);

      // --- 4. Prepare Table Data ---
      const tableRows: any[] = [];
      Object.entries(marks).forEach(([courseCode, course]) => {
        const subjectName = getCourseTitle(courseCode);

        // Subject Header Row
        tableRows.push([
          {
            content: `${courseCode} - ${subjectName}`,
            colSpan: 3,
            styles: {
              fillColor: [30, 30, 30],
              textColor: [255, 85, 0],
              fontStyle: "bold",
            },
          },
        ]);

        // Assessment Rows
        course.tests.forEach((t: any) => {
          tableRows.push([
            t.test_name,
            `${formatNumber(t.obtained_marks)} / ${formatNumber(
              t.max_marks
            )}`,
            `${t.percentage.toFixed(2)}%`,
          ]);
        });
      });

      // --- 5. Render Table ---
      autoTable(doc, {
        startY: 50,
        head: [["Assessment", "Marks", "Percentage"]],
        body: tableRows,
        theme: "grid",
        styles: {
          fillColor: [0, 0, 0],
          textColor: [255, 255, 255],
          lineColor: [40, 40, 40],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [255, 85, 0],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [10, 10, 10],
        },
      });

      // --- 6. Handle Action ---
      if (action === "share") {
        const pdFBlob = doc.output("blob");
        const file = new File([pdFBlob], "academic-report.pdf", {
          type: "application/pdf",
        });

        if (navigator.share) {
          await navigator.share({
            files: [file],
            title: "Academic Performance Report",
            text: "Here is my academic performance report from Console X Academia.",
          });
        } else {
          alert(
            "Sharing is not supported on this device. The file will be downloaded."
          );
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

  return (
    <div className="w-full animate-fade-in">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-0 space-y-6 lg:space-y-8">
        {/* Top Header Card */}
        <div className="glass-card rounded-xl border border-white/10 p-4 sm:p-5 md:p-6 flex flex-col gap-4 md:gap-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 md:gap-6">
            {/* Student Info */}
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2 break-words">
                Academic Performance
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[11px] sm:text-xs font-mono break-all">
                  {data.attendance.student_info.registration_number}
                </span>
                <span className="hidden xs:inline">•</span>
                <span className="truncate max-w-full">
                  {data.attendance.student_info.name}
                </span>
              </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full lg:w-auto">
              <div className="flex flex-col justify-center px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">
                  Courses
                </p>
                <p className="text-lg sm:text-xl font-bold text-white">
                  {totalCourses}
                </p>
              </div>
              <div className="flex flex-col justify-center px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">
                  Assessments
                </p>
                <p className="text-lg sm:text-xl font-bold text-white">
                  {totalAssessments}
                </p>
              </div>
              <div className="flex flex-col justify-center px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">
                  Overall %
                </p>
                <p className="text-lg sm:text-xl font-bold text-white">
                  {formatNumber(overallPercentage)}
                </p>
              </div>
            </div>
          </div>

          {/* Actions Row (scrollable on tiny screens) */}
          <div className="flex flex-row items-center justify-between gap-3 flex-wrap mt-1">
            <p className="text-xs text-muted-foreground">
              Generated for current semester. Use refresh to sync latest marks.
            </p>
            <div className="flex flex-row gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-1 pl-1">
              {/* Share Button */}
              <button
                onClick={() => generatePDF("share")}
                disabled={isGenerating || isLoading}
                className="p-2.5 sm:p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-green-500/50 transition-all duration-200 group text-green-400 disabled:opacity-50 shrink-0"
                title="Share PDF"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              </button>

              {/* Export PDF Button */}
              <button
                onClick={() => generatePDF("download")}
                disabled={isGenerating || isLoading}
                className="p-2.5 sm:p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all duration-200 group text-gray-400 hover:text-primary disabled:opacity-50 shrink-0"
                title="Download PDF"
              >
                {isGenerating ? (
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                )}
              </button>

              {/* Refresh Button */}
              <button
                onClick={refreshData}
                disabled={isLoading || isGenerating}
                className={`p-2.5 sm:p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all duration-200 group shrink-0 ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                title="Refresh Data"
              >
                <svg
                  className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-primary transition-colors ${
                    isLoading ? "animate-spin" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

                {/* Marks Cards List (no grid) */}
        <div className="space-y-5 sm:space-y-6">
          {Object.entries(marks).map(([courseCode, course], index) => {
            const totalObtained = course.tests.reduce(
              (sum: number, t: any) => sum + (t.obtained_marks ?? 0),
              0
            );
            const totalMax = course.tests.reduce(
              (sum: number, t: any) => sum + (t.max_marks ?? 0),
              0
            );

            const avgPercentage =
              course.tests.length > 0 && totalMax > 0
                ? (totalObtained / totalMax) * 100
                : 0;

            const subjectName = getCourseTitle(courseCode);

            return (
              <div
                key={courseCode}
                className="glass-card rounded-xl overflow-hidden hover:border-primary/30 transition-all duration-300 group flex flex-col"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {/* Card Header */}
                <div className="p-4 sm:p-5 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded break-all">
                          {courseCode}
                        </span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {course.course_type}
                        </span>
                      </div>
                      <h3 className="font-bold text-base sm:text-lg text-white group-hover:text-primary transition-colors line-clamp-2">
                        {subjectName}
                      </h3>
                    </div>
                    <div className="flex flex-row md:flex-col items-end justify-between gap-2 shrink-0">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl sm:text-2xl font-bold text-white">
                          {formatNumber(totalObtained)}
                        </span>
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          / {formatNumber(totalMax)}
                        </span>
                      </div>
                      <span className="text-[11px] sm:text-xs text-muted-foreground">
                        Avg: {formatNumber(avgPercentage)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col">
                  {course.tests.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-white/10 rounded-lg">
                      <p className="text-muted-foreground text-sm">
                        No assessments recorded yet
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {course.tests.map((t: any) => (
                        <div
                          key={t.test_name}
                          className="bg-white/5 rounded-lg p-3 border border-white/5 hover:bg-white/10 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <p
                              className="font-medium text-xs sm:text-sm text-gray-200 truncate pr-2"
                              title={t.test_name}
                            >
                              {t.test_name}
                            </p>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getPerformanceColor(
                                t.percentage
                              )}`}
                            >
                              {t.percentage.toFixed(0)}%
                            </span>
                          </div>

                          <div className="flex items-end justify-between mb-1.5">
                            <span className="text-[11px] sm:text-xs text-muted-foreground">
                              Score
                            </span>
                            <span className="text-[11px] sm:text-xs font-mono text-white">
                              {formatNumber(t.obtained_marks)}{" "}
                              <span className="text-gray-600">/</span>{" "}
                              {formatNumber(t.max_marks)}
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full ${getProgressBarColor(
                                t.percentage
                              )} transition-all duration-1000 ease-out`}
                              style={{
                                width: `${Math.min(t.percentage, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>


        {Object.keys(marks).length === 0 && (
          <div className="text-center py-12 glass-card rounded-xl px-4">
            <p className="text-muted-foreground">
              No marks data available for this semester.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
