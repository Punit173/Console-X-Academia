"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallButton() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isAndroid, setIsAndroid] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Detect Platform
        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent);
        const android = /android/.test(userAgent);
        setIsIOS(ios);
        setIsAndroid(android);

        // Check if already installed
        if ((window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Listen for beforeinstallprompt event (Desktop PWA)
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.addEventListener("appinstalled", handleAppInstalled);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
            window.removeEventListener("appinstalled", handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (isAndroid) {
            window.open("https://play.google.com/store/apps/details?id=com.akshat.academia", "_blank");
            return;
        }

        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === "accepted") {
                setIsInstalled(true);
            }
            setDeferredPrompt(null);
            setShowPrompt(false);
        }
    };

    // Don't show if already installed or dismissed
    if (isInstalled || isDismissed) return null;

    // Show install button for Android (Play Store), iOS (Instructions), or Desktop PWA
    const shouldShow = deferredPrompt !== null || isIOS || isAndroid;

    if (!shouldShow) return null;

    return (
        <>
            {/* Install Button */}
            <div className="fixed bottom-20 right-4 z-40 sm:bottom-6 sm:right-6 group">
                <button
                    onClick={() => setIsDismissed(true)}
                    className="absolute -top-1 -right-1 bg-black/60 hover:bg-red-500/80 text-white/60 hover:text-white rounded-full p-1 backdrop-blur-sm transition-all border border-white/10"
                    title="Dismiss"
                >
                    <X className="w-3 h-3" />
                </button>
                <motion.button
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => isAndroid ? handleInstallClick() : setShowPrompt(true)}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-3 px-5 rounded-full shadow-lg shadow-green-500/20 flex items-center gap-2 transition-all duration-200 border border-white/20"
                >
                    <Download className="w-5 h-5" />
                    <span className="hidden sm:inline">
                        {isAndroid ? "Get on Play Store" : "Install App"}
                    </span>
                </motion.button>
            </div>

            {/* Installation Prompt Modal */}
            <AnimatePresence>
                {showPrompt && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-black/80 backdrop-blur-xl border border-white/10 text-white w-full max-w-sm rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl relative"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                                        <Download className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-lg font-bold">Install ConsoleXAcademia</h3>
                                </div>
                                <button
                                    onClick={() => setShowPrompt(false)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-gray-300 text-sm mb-6">
                                {isIOS
                                    ? "Add Console X Academia to your home screen for quick access to your academic dashboard."
                                    : "Install Console X Academia on your device for a faster, offline-capable experience."}
                            </p>

                            <div className="space-y-3 mb-6">
                                {isIOS ? (
                                    <>
                                        <div className="flex items-start gap-3 text-sm">
                                            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-500/20 rounded-full text-blue-400 font-semibold text-xs">1</span>
                                            <span className="text-gray-300">Tap the <span className="font-semibold text-blue-400">Share</span> button at the bottom</span>
                                        </div>
                                        <div className="flex items-start gap-3 text-sm">
                                            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-500/20 rounded-full text-blue-400 font-semibold text-xs">2</span>
                                            <span className="text-gray-300">Select <span className="font-semibold text-blue-400">Add to Home Screen</span></span>
                                        </div>
                                        <div className="flex items-start gap-3 text-sm">
                                            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-500/20 rounded-full text-blue-400 font-semibold text-xs">3</span>
                                            <span className="text-gray-300">Tap <span className="font-semibold text-blue-400">Add</span> to confirm</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-start gap-3 text-sm">
                                            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-500/20 rounded-full text-blue-400 font-semibold text-xs">✓</span>
                                            <span className="text-gray-300">Offline access to your dashboard</span>
                                        </div>
                                        <div className="flex items-start gap-3 text-sm">
                                            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-500/20 rounded-full text-blue-400 font-semibold text-xs">✓</span>
                                            <span className="text-gray-300">Works like a native mobile app</span>
                                        </div>
                                        <div className="flex items-start gap-3 text-sm">
                                            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-500/20 rounded-full text-blue-400 font-semibold text-xs">✓</span>
                                            <span className="text-gray-300">Quick access from your home screen</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {!isIOS && (
                                <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                    <p className="text-xs text-gray-400">
                                        💡 <span className="text-gray-300">The app will appear on your home screen and in your app drawer</span>
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowPrompt(false)}
                                    className="flex-1 px-4 py-3 rounded-lg border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 transition-colors font-medium"
                                >
                                    Later
                                </button>
                                {!isIOS && (
                                    <button
                                        onClick={handleInstallClick}
                                        className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold transition-all duration-200"
                                    >
                                        Install Now
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
