"use client";

import { useState, useEffect } from "react";
import { Share, Plus, X, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function IOSInstallPrompt() {
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(ios);

        // Detect if already installed (standalone mode)
        const standalone =
            (window.navigator as any).standalone === true ||
            window.matchMedia('(display-mode: standalone)').matches;
        setIsStandalone(standalone);

    }, []);

    if (!isIOS || isStandalone) return null;

    return (
        <>
            {/* Install Button (Floating) */}
            <div className="fixed bottom-20 right-4 z-50 md:hidden">
                <button
                    onClick={() => setShowPrompt(true)}
                    className="bg-white text-black font-bold py-2 px-4 rounded-full shadow-lg flex items-center gap-2 text-sm border border-gray-200"
                >
                    <Smartphone className="w-4 h-4" /> Install App
                </button>
            </div>

            {/* Instruction Modal */}
            <AnimatePresence>
                {showPrompt && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            className="bg-[#1c1c1e] text-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl border-t border-white/10"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <h3 className="text-lg font-bold">Install Console X</h3>
                                <button onClick={() => setShowPrompt(false)} className="text-gray-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-gray-400 text-sm mb-6">
                                Install this application on your home screen for quick and easy access.
                            </p>

                            <div className="space-y-4">
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white/10 rounded-full text-blue-400">1</span>
                                    <span>Tap the <Share className="inline w-4 h-4 mx-1 text-blue-400" /> <b>Share</b> button below.</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white/10 rounded-full text-blue-400">2</span>
                                    <span>Select <span className="inline-flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded text-xs font-semibold"><Plus className="w-3 h-3" /> Add to Home Screen</span>.</span>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-center">
                                <div className="w-12 h-1 bg-white/20 rounded-full" />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
