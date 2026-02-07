import "./globals.css";
import type { Metadata } from "next";
import { AppDataProvider } from "@/components/AppDataContext";
import { Analytics } from "@vercel/analytics/next"
import { CalendarProvider } from "@/components/CalendarContext";
import Navbar from "@/components/Navbar";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import InstallButton from "@/components/InstallButton";
import LiveChatWidget from "@/components/LiveChatWidget";

export const metadata: Metadata = {
  metadataBase: new URL('https://console-x-academia.vercel.app'),
  title: {
    default: "Console X Academia | Advanced Student Dashboard",
    template: "%s | Console X Academia"
  },
  description: "All-in-one academic dashboard for SRM students. Track attendance, calculate CGPA, view timetable, and access study resources in real-time.",
  keywords: ["SRM", "Academia", "Console X", "Student Dashboard", "CGPA Calculator", "Attendance Tracker", "SRMIST"],
  authors: [{ name: "Console X Team" }],
  creator: "Console X Team",
  publisher: "Console X Academia",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://console-x-academia.vercel.app",
    title: "Console X Academia | Advanced Student Dashboard",
    description: "All-in-one academic dashboard: Attendance, CGPA, Timetable & more.",
    siteName: "Console X Academia",
    images: [{
      url: "/assets/logo.jpg",
      width: 1200,
      height: 630,
      alt: "Console X Academia Dashboard"
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Console X Academia",
    description: "All-in-one academic dashboard for SRM students.",
    images: ["/assets/logo.jpg"],
    creator: "@ConsoleXAcademia"
  },
  manifest: "/manifest.json",
  icons: {
    apple: "/assets/logo.jpg",
    icon: "/assets/logo.jpg"
  }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Console X Academia",
  "applicationCategory": "EducationalApplication",
  "operatingSystem": "Web, Android",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "INR"
  },
  "description": "Advanced academic management system for students to track attendance and grades.",
  "url": "https://console-x-academia.vercel.app",
  "author": {
    "@type": "Organization",
    "name": "Console X Team"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-background text-foreground h-screen flex flex-col selection:bg-primary selection:text-white overflow-hidden">
        <AppDataProvider>
          <CalendarProvider>
            {/* Background Ambient Glow */}
            <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
              <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] opacity-50"></div>
              <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] opacity-30"></div>
            </div>

            <Navbar />
            <InstallButton />
            <Analytics/>
            {/* <WhatsAppButton /> */}

            {/* Scrollable Content Wrapper with Mask */}
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
