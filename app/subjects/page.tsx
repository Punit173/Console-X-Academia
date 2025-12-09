// app/subjects/page.tsx
"use client";

import { useAppData } from "@/components/AppDataContext";

export default function SubjectsPage() {
  const { data } = useAppData();

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
          Please login from the home page to view your subjects.
        </p>
      </div>
    );
  }

  const { courses, total_credits, advisors } = data.timetable;

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

  return (
    <div className="w-full animate-fade-in">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-0 space-y-8">
        {/* Header */}
        <div className="border-b border-white/10 pb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2 break-words">
            Subjects &amp; Timetable
          </h1>
          <p className="text-muted-foreground text-sm">
            Semester {data.timetable.student_info.semester} •{" "}
            {data.timetable.student_info.department}
          </p>
        </div>

        {/* Advisors & Credits */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Academic Team */}
          <div className="lg:col-span-2 glass-card rounded-xl p-5 sm:p-6">
            <h2 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
              Academic Team
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Faculty Advisor */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/5 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    Faculty Advisor
                  </p>
                </div>
                <p className="font-semibold text-white text-sm truncate">
                  {advisors.faculty_advisor.name}
                </p>
                <a
                  href={`mailto:${advisors.faculty_advisor.email}`}
                  className="text-xs text-primary hover:underline truncate block mt-1"
                >
                  {advisors.faculty_advisor.email}
                </a>
              </div>

              {/* Academic Advisor */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/5 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    Academic Advisor
                  </p>
                </div>
                <p className="font-semibold text-white text-sm truncate">
                  {advisors.academic_advisor.name}
                </p>
                <a
                  href={`mailto:${advisors.academic_advisor.email}`}
                  className="text-xs text-primary hover:underline truncate block mt-1"
                >
                  {advisors.academic_advisor.email}
                </a>
              </div>
            </div>
          </div>

          {/* Credits Card */}
          <div className="glass-card rounded-xl p-6 flex flex-col justify-center items-center text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2 relative z-10">
              Total Credits
            </p>
            <p className="text-5xl sm:text-6xl font-bold text-white relative z-10">
              {total_credits}
            </p>
            <p className="text-xs text-muted-foreground mt-2 relative z-10">
              Registered for this semester
            </p>
          </div>
        </div>

        {/* Courses List */}
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

          {/* Responsive grid for course cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {courses.map((c, index) => {
              const style = getCourseTypeStyle(c.course_type);
              return (
                <div
                  key={c.s_no}
                  className="glass-card rounded-xl p-4 sm:p-5 hover:border-primary/30 transition-all duration-300 group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 md:gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide border ${style.bg} ${style.color} ${style.border}`}
                        >
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
                        <p className="text-[10px] text-muted-foreground uppercase">
                          Credits
                        </p>
                        <p className="text-lg font-bold text-white">
                          {c.credit}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-gray-400 shrink-0">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                          Slot
                        </p>
                        <p className="text-sm text-white font-medium">
                          {c.slot}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-gray-400 shrink-0">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                          Room
                        </p>
                        <p className="text-sm text-white font-medium">
                          {c.room_no || "TBA"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-gray-400 shrink-0">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                          Faculty
                        </p>
                        <p
                          className="text-sm text-white font-medium truncate"
                          title={c.faculty_name}
                        >
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
    </div>
  );
}
