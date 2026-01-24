
"use client";

import { motion } from "framer-motion";

interface LeetCodeChartProps {
    easy: number;
    medium: number;
    hard: number;
    total: number;
    totalQuestions?: number;
}

export default function LeetCodeChart({ easy, medium, hard, total, totalQuestions = 3300 }: LeetCodeChartProps) {
    // Config
    const radius = 45; // Slightly larger radius for thinner look
    const circumference = 2 * Math.PI * radius;
    const center = 60; // Center of 120x120 SVG
    const strokeWidth = 5; // Thinner stroke

    const totalSafe = totalQuestions || 1;
    const easyPct = (easy / totalSafe);
    const mediumPct = (medium / totalSafe);
    const hardPct = (hard / totalSafe);

    // Calculate dash arrays for segments
    // We will render simple arcs.
    // However, to make them look like the screenshot (segmented rings):
    // The screenshot actually looks like a single progress bar broken into colors?
    // Or 3 separate segments?
    // The prompt says "Circular Chart with detailed legend".
    // Let's stick to the previous logic but improve style: thin rings, gap between segments?
    // Actually, standard LeetCode style is usually accumulative or stacked.
    // Let's use a stacked approach but make it look contiguous.

    // Dash calculations
    const easyDash = `${easyPct * circumference} ${circumference}`;
    // For stacking, we need offsets.
    // But if we want them to appear as one continuous line changing colors:
    // It's easier to render 3 circles on top of each other if they start from 0?
    // No, they need to be end-to-end for a "composition" look, OR concentric for "multi-ring".
    // The screenshot "DSA Progress" typically implies a single ring with multiple colors.

    // Let's try the "Single Ring, Multiple Colors" approach.
    const easyLength = easyPct * circumference;
    const mediumLength = mediumPct * circumference;
    const hardLength = hardPct * circumference;

    // We add a tiny gap?
    const gap = 2;

    return (
        <div className="flex flex-col items-center w-full">
            {/* 1. Circle Chart */}
            <div className="relative w-40 h-40 flex-shrink-0 mb-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    {/* Background Track */}
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="transparent"
                        stroke="#27272a" // zinc-800
                        strokeWidth={strokeWidth}
                    />

                    {/* Easy Segment */}
                    <motion.circle
                        initial={{ strokeDasharray: `0 ${circumference}` }}
                        animate={{ strokeDasharray: `${easyLength} ${circumference}` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="transparent"
                        stroke="#10B981" // emerald-500
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDashoffset={0}
                    />

                    {/* Medium Segment */}
                    <motion.circle
                        initial={{ strokeDasharray: `0 ${circumference}` }}
                        animate={{ strokeDasharray: `${mediumLength} ${circumference}` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="transparent"
                        stroke="#FCD34D" // amber-300
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDashoffset={-1 * easyLength} // Start after Easy
                    />

                    {/* Hard Segment */}
                    <motion.circle
                        initial={{ strokeDasharray: `0 ${circumference}` }}
                        animate={{ strokeDasharray: `${hardLength} ${circumference}` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="transparent"
                        stroke="#EF4444" // red-500
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDashoffset={-1 * (easyLength + mediumLength)} // Start after Easy + Medium
                    />
                </svg>

                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <div className="text-3xl font-bold leading-none">
                        {total}
                    </div>
                    <div className="w-8 h-px bg-gray-700 my-1"></div>
                    <div className="text-xs text-gray-500 font-mono">
                        {totalQuestions}
                    </div>
                </div>
            </div>

            {/* 2. Legend / Details (Bottom Row) */}
            <div className="flex items-center justify-center gap-6 w-full text-xs">
                {/* Easy */}
                <div className="flex flex-col items-center gap-1">
                    <div className="text-gray-400 font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        Easy
                    </div>
                    <div className="text-white font-bold">{easy} <span className="text-gray-600">/</span> <span className="text-gray-500">{totalQuestions && Math.round(totalQuestions * 0.3)}</span></div>
                </div>

                {/* Medium */}
                <div className="flex flex-col items-center gap-1">
                    <div className="text-gray-400 font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#FCD34D] shadow-[0_0_8px_rgba(252,211,77,0.5)]"></span>
                        Medium
                    </div>
                    <div className="text-white font-bold">{medium} <span className="text-gray-600">/</span> <span className="text-gray-500">{totalQuestions && Math.round(totalQuestions * 0.5)}</span></div>
                </div>

                {/* Hard */}
                <div className="flex flex-col items-center gap-1">
                    <div className="text-gray-400 font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#EF4444] shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
                        Hard
                    </div>
                    <div className="text-white font-bold">{hard} <span className="text-gray-600">/</span> <span className="text-gray-500">{totalQuestions && Math.round(totalQuestions * 0.2)}</span></div>
                </div>
            </div>

            {/* Total Submissions Info (Hidden or Small) */}
            {/* <div className="mt-4 pt-3 border-t border-white/5 w-full flex justify-between text-[10px] text-gray-600 px-2">
                 <span>Total Questions in Platform</span>
                 <span>{totalQuestions}</span>
            </div> */}
        </div>
    );
}
