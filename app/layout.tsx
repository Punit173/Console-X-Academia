// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { AppDataProvider } from "@/components/AppDataContext";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Console X Academia",
  description: "Advanced Academic Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground min-h-screen flex flex-col selection:bg-primary selection:text-white overflow-x-hidden">
        <AppDataProvider>
          {/* Background Ambient Glow */}
          <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] opacity-50"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] opacity-30"></div>
          </div>

          <Navbar />

          {/* Main Content */}
          <main className="flex-1 w-full pt-28 sm:pt-32 pb-12 px-4 sm:px-6">
            <div className="w-full max-w-6xl mx-auto">
              {children}
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t border-white/5 py-8 mt-auto w-full glass-card">
            <div className="w-full max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
              <p>© 2025 Console Academia. All rights reserved.</p>
              <div className="flex gap-6">
                <a href="#" className="hover:text-primary transition-colors">Privacy</a>
                <a href="#" className="hover:text-primary transition-colors">Terms</a>
                <a href="#" className="hover:text-primary transition-colors">Support</a>
              </div>
            </div>
          </footer>
          
        </AppDataProvider>
      </body>
    </html>
  );
}
