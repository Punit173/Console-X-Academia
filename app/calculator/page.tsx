"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, ArrowLeft, GraduationCap } from "lucide-react";
import Link from "next/link";
import { useAppData } from "@/components/AppDataContext";

// Grade to grade point mapping (Matches Android App logic)
const GRADE_POINTS: Record<string, number> = {
    "O": 10.0,
    "A+": 9.0,
    "A": 8.0,
    "B+": 7.0,
    "B": 6.0,
    "C": 5.5,
    "Fail/Det/Abs": 0.0,
};

interface CourseGrade {
    title: string;
    credit: number;
    grade: string;
}

export default function CGPACalculatorPage() {
    const { data } = useAppData();
    const [courses, setCourses] = useState<CourseGrade[]>([]);
    const [cgpa, setCgpa] = useState<number>(0.0);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Load courses from localStorage or populate from AppData if empty
    useEffect(() => {
        const loadCourses = () => {
            try {
                const storedCourses = localStorage.getItem("cgpa-courses");
                if (storedCourses) {
                    setCourses(JSON.parse(storedCourses));
                } else if (data?.timetable?.courses) {
                    // Auto-populate from timetable if no local storage data found
                    const initialCourses: CourseGrade[] = data.timetable.courses
                        .filter((c: any) => c.credit > 0)
                        .map((c: any) => ({
                            title: c.course_title || "Unknown Course",
                            credit: c.credit || 3,
                            grade: "O", // Default grade
                        }));
                    setCourses(initialCourses);
                }
            } catch (e) {
                console.error("Error loading courses:", e);
            } finally {
                setIsLoading(false);
            }
        };

        loadCourses();
    }, [data]);

    // Recalculate CGPA whenever courses change
    useEffect(() => {
        calculateCGPA();
        if (courses.length > 0) {
            localStorage.setItem("cgpa-courses", JSON.stringify(courses));
        }
    }, [courses]);

    const calculateCGPA = () => {
        let totalPoints = 0;
        let totalCredits = 0;

        courses.forEach((course) => {
            if (course.credit > 0) {
                // Fallback to 0 if grade is somehow invalid/missing
                const points = GRADE_POINTS[course.grade] ?? 0;
                totalPoints += points * course.credit;
                totalCredits += course.credit;
            }
        });

        const newCgpa = totalCredits > 0 ? totalPoints / totalCredits : 0.0;
        setCgpa(newCgpa);
    };

    const addCourse = () => {
        setCourses([...courses, { title: "", credit: 3, grade: "O" }]);
    };

    const removeCourse = (index: number) => {
        const newCourses = courses.filter((_, i) => i !== index);
        setCourses(newCourses);
    };

    const updateCourse = (index: number, field: keyof CourseGrade, value: any) => {
        const newCourses = [...courses];
        (newCourses[index] as any)[field] = value;
        setCourses(newCourses);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 pb-24 md:pb-8">
            {/* Header */}
            <div className="max-w-2xl mx-auto flex items-center gap-4 mb-8">
                <Link
                    href="/dashboard"
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-xl font-bold">CGPA Calculator</h1>
                    <p className="text-xs text-gray-400">Calculate your cumulative grade point</p>
                </div>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">

                {/* CGPA Display Card */}
                <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-8 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-orange-500/5 group-hover:bg-orange-500/10 transition-colors" />
                    <h2 className="text-gray-400 text-sm tracking-widest uppercase mb-2 relative z-10">Your Estimated CGPA</h2>
                    <div className="text-6xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent relative z-10">
                        {cgpa.toFixed(2)}
                    </div>
                </div>

                {/* Course List */}
                <div className="space-y-4">
                    {courses.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No courses added. Start by adding a course!</p>
                        </div>
                    ) : (
                        courses.map((course, index) => (
                            <div
                                key={index}
                                className="bg-gray-900/50 border border-white/5 rounded-xl p-4 space-y-3"
                            >
                                <div className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        placeholder={`Course ${index + 1}`}
                                        value={course.title}
                                        onChange={(e) => updateCourse(index, "title", e.target.value)}
                                        className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-600 font-medium"
                                    />
                                    <button
                                        onClick={() => removeCourse(index)}
                                        className="p-2 hover:bg-red-500/10 hover:text-red-400 text-gray-600 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {/* Credits Input */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase text-gray-500 font-semibold pl-1">Credits</label>
                                        <div className="h-10 bg-black rounded-lg border border-white/10 px-3 flex items-center">
                                            <input
                                                type="number"
                                                min="1"
                                                max="10"
                                                value={course.credit}
                                                onChange={(e) => updateCourse(index, "credit", Number(e.target.value) || 0)}
                                                className="w-full bg-transparent border-none outline-none text-white text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Grade Dropdown */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase text-gray-500 font-semibold pl-1">Grade</label>
                                        <div className="h-10 bg-black rounded-lg border border-white/10 px-3 flex items-center relative">
                                            <select
                                                value={course.grade}
                                                onChange={(e) => updateCourse(index, "grade", e.target.value)}
                                                className="w-full bg-transparent border-none outline-none text-white text-sm appearance-none cursor-pointer z-10"
                                            >
                                                {Object.keys(GRADE_POINTS).map((grade) => (
                                                    <option key={grade} value={grade} className="bg-black text-white">
                                                        {grade} ({GRADE_POINTS[grade]})
                                                    </option>
                                                ))}
                                            </select>
                                            {/* Custom Arrow */}
                                            <div className="absolute right-3 pointer-events-none text-gray-500">
                                                <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Add Button */}
                <button
                    onClick={addCourse}
                    className="w-full py-4 rounded-xl bg-white hover:bg-gray-100 text-black font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                    <Plus className="w-5 h-5" />
                    Add Course
                </button>

            </div>
        </div>
    );
}
