// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { AppDataProvider } from "@/components/AppDataContext";
import { CalendarProvider } from "@/components/CalendarContext";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Console X Academia",
  description: "Advanced Academic Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground h-screen flex flex-col selection:bg-primary selection:text-white overflow-hidden">
        <AppDataProvider>
          <CalendarProvider>
            {/* Background Ambient Glow */}
            <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
              <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] opacity-50"></div>
              <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] opacity-30"></div>
            </div>

            <Navbar />

            {/* Scrollable Content Wrapper with Mask */}
            {/* Mask ensures content fades out before hitting the transparent navbar */}
            <div
              className="flex-1 w-full overflow-y-auto overflow-x-hidden"
              style={{
                maskImage: "linear-gradient(to bottom, transparent 0px, transparent 100px, black 140px, black 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, transparent 0px, transparent 100px, black 140px, black 100%)"
              }}
            >
              {/* Main Content */}
              <main className="w-full pt-32 pb-12 px-4 sm:px-6">
                <div className="w-full max-w-6xl mx-auto">
                  {children}
                </div>
              </main>

              {/* Footer */}
              <footer className="border-t border-white/5 py-8 w-full glass-card">
                <div className="w-full max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">

                  <p>© 2025 Console Academia. All rights reserved.</p>

                  <div className="flex gap-6 items-center">

                    {/* 🔗 Play Store Link */}
                    <a
                      href="https://play.google.com/store/apps/details?id=com.akshat.academia"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <span>Android App</span>
                    </a>

                    {/* 🤝 Community Link */}
                    <a
                      href="https://chat.whatsapp.com/B4lNYZtRrAj6lqqRMIGvF5"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <span>Community</span>
                    </a>

                  </div>
                </div>
              </footer>
            </div>
          </CalendarProvider>
        </AppDataProvider>
      </body>

    </html>
  );
}
