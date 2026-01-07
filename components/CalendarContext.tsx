"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

interface CalendarData {
    [dateKey: string]: {
        event: {
            type: string;
            description?: string;
            [key: string]: any;
        }[];
        [key: string]: any;
    };
}

interface CalendarContextValue {
    calendarData: CalendarData;
    isLoading: boolean;
    error: string | null;
    refreshCalendar: () => Promise<void>;
}

const CalendarContext = createContext<CalendarContextValue | undefined>(undefined);

// Cache duration: 24 hours (86400000 ms) because academic calendar changes rarely
const CACHE_DURATION = 24 * 60 * 60 * 1000;

export const CalendarProvider = ({ children }: { children: ReactNode }) => {
    const [calendarData, setCalendarData] = useState<CalendarData>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadCalendarData();
    }, []);

    const loadCalendarData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // 1. Check Local Cache
            const cached = localStorage.getItem("calendar_cache");
            const cachedTime = localStorage.getItem("calendar_cache_time");

            if (cached && cachedTime) {
                const age = Date.now() - parseInt(cachedTime, 10);
                if (age < CACHE_DURATION) {
                    console.log("⚡ [Calendar] Using cached data (Age: " + (age / 60000).toFixed(0) + " mins)");
                    setCalendarData(JSON.parse(cached));
                    setIsLoading(false);
                    return;
                } else {
                    console.log("⌛ [Calendar] Cache expired, fetching new data...");
                }
            } else {
                console.log("☁ [Calendar] No cache found, fetching from Firestore...");
            }

            // 2. Fetch from Firestore
            console.log("🔥 [Calendar] Connecting to Firestore...");
            const querySnapshot = await getDocs(collection(db, "calendar"));
            const events: CalendarData = {};

            querySnapshot.forEach((doc) => {
                events[doc.id] = doc.data() as any;
            });

            const eventCount = Object.keys(events).length;
            console.log(`✅ [Calendar] Fetched ${eventCount} date entries successfully.`);

            if (eventCount > 0) {
                setCalendarData(events);
                localStorage.setItem("calendar_cache", JSON.stringify(events));
                localStorage.setItem("calendar_cache_time", Date.now().toString());
            } else {
                console.warn("⚠️ [Calendar] Fetched 0 events. Is the collection name correct?");
            }

        } catch (err: any) {
            console.error("❌ [Calendar] Error fetching data:", err);
            setError(err.message || "Failed to load calendar");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <CalendarContext.Provider value={{ calendarData, isLoading, error, refreshCalendar: loadCalendarData }}>
            {children}
        </CalendarContext.Provider>
    );
};

export const useCalendar = () => {
    const ctx = useContext(CalendarContext);
    if (!ctx) throw new Error("useCalendar must be used within CalendarProvider");
    return ctx;
};
