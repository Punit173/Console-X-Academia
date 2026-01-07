"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, ArrowLeft, GraduationCap, Calculator, ChevronDown, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAppData } from "@/components/AppDataContext";
import { motion, AnimatePresence } from "framer-motion";

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
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 pb-24 md:pb-8 animate-fade-in relative">

            {/* Background Glow */}
            <div className="fixed top-0 left-0 right-0 h-[500px] bg-orange-500/10 blur-[120px] pointer-events-none" />

            {/* Header */}
            <div className="max-w-2xl mx-auto flex items-center gap-4 mb-8">
                <Link
                    href="/dashboard"
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/5"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                        <Calculator className="w-6 h-6 text-orange-500" />
                        CGPA Calculator
                    </h1>
                    <p className="text-sm text-gray-400">Estimate your cumulative performance</p>
                </div>
            </div>

            <div className="max-w-2xl mx-auto space-y-8">

                {/* CGPA Display Card */}
                <div className="w-full relative overflow-hidden rounded-3xl glass-card border-orange-500/20 p-8 text-center group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-orange-500/20 transition-all duration-500" />

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 rounded-full text-orange-400 text-xs font-bold uppercase tracking-wider mb-4 border border-orange-500/20">
                            <Sparkles className="w-3 h-3" /> Estimate
                        </div>
                        <div className="text-7xl font-black text-white tracking-tighter mb-2 drop-shadow-2xl">
                            {cgpa.toFixed(2)}
                        </div>
                        <p className="text-gray-400 text-sm">Based on {courses.length} courses</p>
                    </div>
                </div>

                {/* Course List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="w-1 h-5 bg-orange-500 rounded-full" />
                            My Courses
                        </h2>
                        <button
                            onClick={addCourse}
                            className="text-xs font-bold bg-white text-black px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
                        >
                            <Plus className="w-3 h-3" /> Add
                        </button>
                    </div>

                    <AnimatePresence>
                        {courses.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="text-center py-12 text-gray-500 glass-card rounded-2xl border-dashed border-gray-700"
                            >
                                <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>No courses added. Start by adding a course!</p>
                            </motion.div>
                        ) : (
                            courses.map((course, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                    className="glass-card rounded-xl p-4 sm:p-5 hover:border-orange-500/30 transition-all group"
                                >
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        {/* Title Input */}
                                        <div className="flex-1">
                                            <label className="text-[10px] uppercase text-gray-500 font-bold mb-1 block pl-1">Course Name</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder={`Course ${index + 1}`}
                                                    value={course.title}
                                                    onChange={(e) => updateCourse(index, "title", e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 focus:bg-white/10 transition-all font-medium"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            {/* Credits Input */}
                                            <div className="w-20">
                                                <label className="text-[10px] uppercase text-gray-500 font-bold mb-1 block pl-1">Credits</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="10"
                                                    value={course.credit}
                                                    onChange={(e) => updateCourse(index, "credit", Number(e.target.value) || 0)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-center focus:outline-none focus:border-orange-500/50 transition-all font-bold"
                                                />
                                            </div>

                                            {/* Grade Dropdown */}
                                            <div className="w-24 relative">
                                                <label className="text-[10px] uppercase text-gray-500 font-bold mb-1 block pl-1">Grade</label>
                                                <div className="relative">
                                                    <select
                                                        value={course.grade}
                                                        onChange={(e) => updateCourse(index, "grade", e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-3 pr-8 py-2.5 text-white appearance-none cursor-pointer focus:outline-none focus:border-orange-500/50 font-bold"
                                                    >
                                                        {Object.keys(GRADE_POINTS).map((grade) => (
                                                            <option key={grade} value={grade} className="bg-neutral-900 text-white">
                                                                {grade}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                                </div>
                                            </div>

                                            {/* Delete Action */}
                                            <div className="pt-6">
                                                <button
                                                    onClick={() => removeCourse(index)}
                                                    className="p-2.5 hover:bg-red-500/10 hover:text-red-400 text-gray-600 rounded-lg transition-colors"
                                                    title="Remove"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>

                <div className="h-4" /> {/* Spacer */}

            </div>
        </div>
    );
}
