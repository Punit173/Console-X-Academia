"use client";

import React from "react";

export function WhatsAppButton() {
    return (
        <a
            href="https://chat.whatsapp.com/B4lNYZtRrAj6lqqRMIGvF5"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 p-3 bg-[#25D366] rounded-full shadow-[0_4px_14px_0_rgba(37,211,102,0.39)] hover:scale-110 hover:shadow-[0_6px_20px_rgba(37,211,102,0.23)] transition-all duration-300 group"
            title="Join WhatsApp Community"
        >
            {/* WhatsApp SVG Icon */}
            <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="#FFFFFF"
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8"
            >
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M18.403 5.633A8.919 8.919 0 0 0 12.053 3c-4.948 0-8.976 4.027-8.978 8.977 0 1.582.413 3.126 1.198 4.488L3 21.116l4.759-1.249a8.981 8.981 0 0 0 4.29 1.093h.004c4.947 0 8.975-4.027 8.977-8.977a8.926 8.926 0 0 0-2.627-6.35m-6.35 13.812h-.003a7.446 7.446 0 0 1-3.798-1.041l-.272-.162-2.824.741.753-2.753-.177-.282a7.448 7.448 0 0 1-1.141-3.971c.002-4.114 3.349-7.461 7.465-7.461a7.413 7.413 0 0 1 5.275 2.188 7.42 7.42 0 0 1 2.183 5.279c-.002 4.114-3.349 7.462-7.461 7.462m4.093-5.589c-.225-.113-1.327-.655-1.533-.73-.205-.075-.354-.112-.504.112-.149.224-.579.73-.709.88-.131.15-.261.169-.486.056-.224-.113-.954-.351-1.817-1.12-673-.56-1.127-.791-1.259-1.016s-.044-.069 0-.172c.105-.105.225-.262.338-.393.112-.131.149-.224.224-.374s.038-.262-.019-.374c-.056-.112-.505-1.217-.692-1.666-.181-.435-.366-.377-.504-.383-.13-.006-.28-.006-.429-.006-.15 0-.393.056-.599.28-.206.225-.787.769-.787 1.876s.805 2.176.917 2.326c.112.149 1.585 2.421 3.838 3.394 2.254.918 2.254.611 2.665.573.412-.038 1.326-.542 1.513-1.066.187-.524.187-.973.131-1.066-.056-.094-.206-.15-.43-.262"
                />
            </svg>
            {/* Tooltip */}
            <span className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1 bg-white text-black text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Join Community
            </span>
        </a>
    );
}
