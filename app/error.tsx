'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="glass-card max-w-md w-full rounded-2xl p-8 text-center animate-fade-in border border-white/10 shadow-2xl">
                <div className="mb-6 flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                        <div className="relative bg-surface p-4 rounded-full border border-white/10">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="40"
                                height="40"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-primary"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" x2="12" y1="8" y2="12" />
                                <line x1="12" x2="12.01" y1="16" y2="16" />
                            </svg>
                        </div>
                    </div>
                </div>

                <h2 className="text-3xl font-bold mb-3 text-white">
                    Something went wrong!
                </h2>

                <p className="text-gray-400 mb-8 leading-relaxed">
                    We encountered an unexpected error while processing your request.
                    Please try again or return to the dashboard.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => reset()}
                        className="px-6 py-2.5 bg-primary hover:bg-orange-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-orange-500/20 active:scale-95"
                    >
                        Try again
                    </button>

                    <Link
                        href="/"
                        className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-medium rounded-xl transition-all duration-200 active:scale-95"
                    >
                        Go Home
                    </Link>
                </div>

                {error.digest && (
                    <p className="mt-8 text-xs text-gray-600 font-mono">
                        Error ID: {error.digest}
                    </p>
                )}
            </div>
        </div>
    );
}
