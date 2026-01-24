"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { ArrowLeft, Coffee, Sun, Moon, Utensils, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

// --- Types ---
type MealMap = {
    breakfast?: string[];
    lunch?: string[];
    snacks?: string[];
    dinner?: string[];
};

type DayMap = {
    [day: string]: MealMap;
};

type MessMenuMap = {
    [block: string]: DayMap;
};

// --- Constants ---
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const DAY_COLORS: { [key: string]: string } = {
    'mon': "text-[#D2FEA0] bg-[#D2FEA0]/10 border-[#D2FEA0]/20",
    'tue': "text-[#8CC0FF] bg-[#8CC0FF]/10 border-[#8CC0FF]/20",
    'wed': "text-[#C3A6FF] bg-[#C3A6FF]/10 border-[#C3A6FF]/20",
    'thu': "text-[#FFB38A] bg-[#FFB38A]/10 border-[#FFB38A]/20",
    'fri': "text-[#51A0E6] bg-[#51A0E6]/10 border-[#51A0E6]/20",
    'sat': "text-[#FF85A1] bg-[#FF85A1]/10 border-[#FF85A1]/20",
    'sun': "text-[#85FFD1] bg-[#85FFD1]/10 border-[#85FFD1]/20",
};

export default function MessMenuPage() {
    const router = useRouter();
    const [data, setData] = useState<MessMenuMap | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedBlock, setSelectedBlock] = useState<string>("");
    const [selectedDay, setSelectedDay] = useState<string>("mon");

    // --- 1. Init Logic ---
    useEffect(() => {
        // Determine current day
        const today = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
        if (DAYS.includes(today)) setSelectedDay(today);

        // Load saved block
        const saved = localStorage.getItem("last_hostel_block");
        if (saved) setSelectedBlock(saved);

        fetchMenu();
    }, []);

    // --- 2. Fetch Data ---
    const fetchMenu = async () => {
        try {
            setLoading(true);
            const db = getFirestore(app);
            const docRef = doc(db, "mess", "messmenu");
            const snap = await getDoc(docRef);

            if (snap.exists()) {
                const menuData = snap.data() as MessMenuMap;
                setData(menuData);

                // If no block selected yet, pick first available
                if (!localStorage.getItem("last_hostel_block")) {
                    const firstBlock = Object.keys(menuData)[0];
                    if (firstBlock) setSelectedBlock(firstBlock);
                }
            } else {
                setError("Menu not available at the moment.");
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load menu. Please check your internet connection.");
        } finally {
            setLoading(false);
        }
    };

    // --- 3. Helpers ---
    const handleBlockChange = (block: string) => {
        setSelectedBlock(block);
        localStorage.setItem("last_hostel_block", block);
    };

    const getActiveColorClass = () => DAY_COLORS[selectedDay] || DAY_COLORS['mon'];

    // Meal Icons
    const getMealIcon = (type: string) => {
        switch (type) {
            case 'breakfast': return <Sun className="w-5 h-5" />;
            case 'lunch': return <Utensils className="w-5 h-5" />;
            case 'snacks': return <Coffee className="w-5 h-5" />;
            case 'dinner': return <Moon className="w-5 h-5" />;
            default: return <Utensils className="w-5 h-5" />;
        }
    };

    // --- 4. Render Logic ---
    if (loading) {
        return (
            <div className="min-h-screen bg-[#090A0F] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-orange-500 rounded-full border-t-transparent animate-spin" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-[#090A0F] flex flex-col items-center justify-center text-white p-6 text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Oops!</h2>
                <p className="text-gray-400 mb-6">{error || "No data received"}</p>
                <button
                    onClick={() => router.back()}
                    className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const activeColor = getActiveColorClass();
    const currentMenu = data[selectedBlock]?.[selectedDay] || {};
    const activeTextColor = activeColor.split(' ')[0];
    const activeBgColor = activeColor.split(' ')[1];
    const activeBorderColor = activeColor.split(' ')[2];

    return (
        <div className="min-h-screen bg-[#090A0F] text-foreground font-sans selection:bg-orange-500/30">

            {/* Background Glow */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className={`absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full opacity-20 blur-[120px] ${activeBgColor.replace('/10', '/30')}`} />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto p-4 sm:p-6 pb-20">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8 pt-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                    >
                        <ArrowLeft className="w-6 h-6 text-white" />
                    </button>
                    <h1 className="text-3xl font-black text-white tracking-tight">Mess Menu</h1>
                </div>

                {/* 1. Block Selector */}
                <div className="mb-8 overflow-x-auto pb-2 scrollbar-hide">
                    <div className="flex gap-3">
                        {Object.keys(data).map((block) => {
                            const isActive = block === selectedBlock;
                            return (
                                <button
                                    key={block}
                                    onClick={() => handleBlockChange(block)}
                                    className={`px-6 py-3 rounded-full text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap
                    ${isActive
                                            ? `${activeBgColor} ${activeTextColor} border ${activeBorderColor} shadow-[0_0_20px_rgba(0,0,0,0.3)]`
                                            : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
                                        }`}
                                >
                                    {block}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Day Selector */}
                <div className="mb-8">
                    <div className="glass-card rounded-2xl p-2 flex justify-between items-center overflow-x-auto scrollbar-hide">
                        {DAYS.map((day) => {
                            const isActive = day === selectedDay;
                            return (
                                <button
                                    key={day}
                                    onClick={() => setSelectedDay(day)}
                                    className={`flex-1 min-w-[3rem] py-3 rounded-xl text-xs font-black uppercase transition-all
                    ${isActive
                                            ? `${activeBgColor} ${activeTextColor}`
                                            : 'text-gray-500 hover:text-gray-300'
                                        }`}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 3. Meal List */}
                <div className="space-y-4">
                    {Object.entries(currentMenu).length === 0 ? (
                        <div className="text-center py-20 text-gray-500">
                            <Utensils className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No menu available for this day.</p>
                        </div>
                    ) : (
                        ['breakfast', 'lunch', 'snacks', 'dinner'].map((mealType) => {
                            const items = (currentMenu as any)[mealType] as string[];
                            if (!items || items.length === 0) return null;

                            // Determine if "Live" (based on current time)
                            // This is approximate logic
                            const hour = new Date().getHours();
                            let isLive = false;
                            if (mealType === 'breakfast' && hour >= 6 && hour < 11) isLive = true;
                            if (mealType === 'lunch' && hour >= 11 && hour < 15) isLive = true;
                            if (mealType === 'snacks' && hour >= 16 && hour < 18) isLive = true;
                            if (mealType === 'dinner' && hour >= 18 && hour < 22) isLive = true;

                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={mealType}
                                    className={`glass-card rounded-3xl p-6 border transition-all duration-300
                    ${isLive ? `border-white/20 shadow-[0_0_30px_rgba(0,0,0,0.2)] bg-gradient-to-br from-white/10 to-transparent` : 'border-white/5'}`
                                    }
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${isLive ? activeBgColor + ' ' + activeTextColor : 'bg-white/5 text-gray-400'}`}>
                                                {getMealIcon(mealType)}
                                            </div>
                                            <h3 className={`text-lg font-black uppercase tracking-wider ${isLive ? 'text-white' : 'text-gray-400'}`}>
                                                {mealType}
                                            </h3>
                                        </div>
                                        {isLive && (
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${activeBgColor} ${activeTextColor}`}>
                                                Live
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {items.map((item, i) => (
                                            <span
                                                key={i}
                                                className={`px-4 py-2 rounded-xl text-sm font-medium border
                          ${isLive
                                                        ? 'bg-black/20 text-white border-white/10'
                                                        : 'bg-white/5 text-gray-400 border-transparent'
                                                    }`}
                                            >
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>

            </div>
        </div>
    );
}
