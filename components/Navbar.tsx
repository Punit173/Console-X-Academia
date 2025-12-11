"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppData } from "@/components/AppDataContext";
import Image from "next/image";
import logo from "../public/assets/logo.jpg";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function Navbar() {
  const { data, setData, setCredentials } = useAppData();
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // If not logged in, don't show the navbar
  if (!data) return null;

  const handleLogout = () => {
    setData(null);
    setCredentials(null);
    router.push("/");
  };

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  // --- Theme Logic: Only Affects Active Links and Install Button ---
  const getThemeStyles = () => {
    switch (pathname) {
      case "/attendance":
        return {
          activeLink: "bg-blue-600/20 text-blue-300 border border-blue-500/30",
          hoverLink: "hover:text-white hover:bg-blue-600/10",
          installButton: "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:shadow-blue-500/50",
        };
      case "/marks":
        return {
          activeLink: "bg-green-600/20 text-green-300 border border-green-500/30",
          hoverLink: "hover:text-white hover:bg-green-600/10",
          installButton: "from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:shadow-green-500/50",
        };
      case "/timetable":
        return {
          activeLink: "bg-pink-600/20 text-pink-300 border border-pink-500/30",
          hoverLink: "hover:text-white hover:bg-pink-600/10",
          installButton: "from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 hover:shadow-pink-500/50",
        };
      default:
        return {
          activeLink: "bg-primary/10 text-primary border border-primary/20",
          hoverLink: "hover:text-white hover:bg-white/5",
          installButton: "from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 hover:shadow-orange-500/50",
        };
    }
  };

  const theme = getThemeStyles();

  return (
    // Nav Container: Retains original 'glass' style and fixed position/sizing
    <nav className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 w-[95%] sm:w-[90%] max-w-6xl z-50 glass mobile-solid-nav rounded-2xl px-3 py-3 sm:px-6 sm:py-4 shadow-2xl shadow-black/20 transition-all duration-300">
      {/* Top row: logo + desktop nav + mobile hamburger */}
      <div className="flex items-center justify-between gap-3">
        {/* Logo - Colors Preserved (as requested) */}
        <Link
          href="/"
          className="flex items-center gap-2 sm:gap-3 group shrink-0"
        >
          <div className="rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300 overflow-hidden">
            <Image
              src={logo}
              alt="Logo"
              width={32}
              height={32}
              className="sm:w-10 sm:h-10"
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm sm:text-lg font-bold tracking-tight text-white group-hover:text-primary transition-colors duration-300">
              CONSOLE<span className="text-orange-500"> X </span>ACADEMIA
            </h1>
          </div>
        </Link>

        {/* Desktop / Tablet nav */}
        <div className="hidden md:flex items-center gap-2">
          <NavLink
            href="/dashboard"
            label="Dashboard"
            active={pathname === "/dashboard"}
            theme={theme}
          />

          {/* Academics Dropdown */}
          <NavDropdown
            label="Academics"
            items={[
              { href: "/marks", label: "Marks" },
              { href: "/attendance", label: "Attendance" },
              { href: "/timetable", label: "Timetable" },
              { href: "/calendar", label: "Calendar" },
            ]}
            pathname={pathname}
            theme={theme}
          />

          {/* Material Dropdown */}
          <NavDropdown
            label="Campus"
            items={[
              { href: "/announcements", label: "Announcements" },
              { href: "/resources", label: "Resources" },
            ]}
            pathname={pathname}
            theme={theme}
          />

          <div className="w-px h-6 bg-white/10 mx-2 flex-shrink-0" />

          {/* Install Now Button - Dynamic Gradient */}
          <a
            href="https://play.google.com/store/apps/details?id=com.akshat.academia"
            target="_blank"
            rel="noopener noreferrer"
            className={`px-4 py-2 text-sm font-bold bg-gradient-to-r ${theme.installButton} text-white rounded-lg transition-all duration-200 flex items-center gap-2 active:scale-95`}
          >
            Install on
            <img
              src="https://img.icons8.com/?size=100&id=22982&format=png&color=ffffff"
              alt="Google Play Icon"
              className="w-4 h-4"
            />
          </a>

          <button
            onClick={handleLogout}
            className="px-3 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200 flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Logout</span>
          </button>
        </div>

        {/* Mobile controls: hamburger + quick logout */}
        <div className="flex items-center gap-2 md:hidden">
          {/* Same Mobile Code as before */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
            title="Logout"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>

          <button
            onClick={toggleMenu}
            className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu - FLATTENED LIST for simplicity on mobile */}
      {isMenuOpen && (
        <div className="mt-3 border-t border-white/10 pt-3 md:hidden">
          <div className="flex flex-col gap-2">
            <NavLink href="/dashboard" label="Dashboard" active={pathname === "/dashboard"} mobile onClick={() => setIsMenuOpen(false)} theme={theme} />

            <div className="px-3 text-xs font-bold text-white/40 uppercase mt-2">Academics</div>
            <NavLink href="/marks" label="Marks" active={pathname === "/marks"} mobile onClick={() => setIsMenuOpen(false)} theme={theme} />
            <NavLink href="/attendance" label="Attendance" active={pathname === "/attendance"} mobile onClick={() => setIsMenuOpen(false)} theme={theme} />
            <NavLink href="/timetable" label="Timetable" active={pathname === "/timetable"} mobile onClick={() => setIsMenuOpen(false)} theme={theme} />
            <NavLink href="/calendar" label="Calendar" active={pathname === "/calendar"} mobile onClick={() => setIsMenuOpen(false)} theme={theme} />

            <div className="px-3 text-xs font-bold text-white/40 uppercase mt-2">Campus</div>
            <NavLink href="/announcements" label="Announcements" active={pathname === "/announcements"} mobile onClick={() => setIsMenuOpen(false)} theme={theme} />
            <NavLink href="/resources" label="Resources" active={pathname === "/resources"} mobile onClick={() => setIsMenuOpen(false)} theme={theme} />

            <a
              href="https://play.google.com/store/apps/details?id=com.akshat.academia"
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full px-4 py-2 text-sm font-bold bg-gradient-to-r ${theme.installButton} text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 mt-4`}
            >
              Install on
              <img
                src="https://img.icons8.com/?size=100&id=22982&format=png&color=ffffff"
                alt="Google Play Icon"
                className="w-4 h-4"
              />
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({
  href,
  label,
  active,
  mobile = false,
  onClick,
  theme,
}: {
  href: string;
  label: string;
  active: boolean;
  mobile?: boolean;
  onClick?: () => void;
  theme: any;
}) {
  const baseClasses =
    "text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap";

  // Use dynamic theme classes for active and hover states
  const activeClasses = theme.activeLink;
  const inactiveClasses = `text-gray-400 ${theme.hoverLink}`;

  const mobileClasses = "w-full px-3 py-2";
  const desktopClasses = "px-3 sm:px-4 py-2";

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`${baseClasses} ${active ? activeClasses : inactiveClasses
        } ${mobile ? mobileClasses : desktopClasses}`}
    >
      {label}
    </Link>
  );
}

// New Dropdown Component
function NavDropdown({ label, items, pathname, theme }: { label: string, items: { href: string, label: string }[], pathname: string, theme: any }) {
  const isActive = items.some(item => item.href === pathname);

  return (
    <div className="relative group">
      <button className={`flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-lg transition-all ${isActive ? theme.activeLink : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
        {label}
        <ChevronDown className="w-3 h-3 group-hover:rotate-180 transition-transform duration-300" />
      </button>

      <div className="absolute top-full left-0 pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
        <div className="glass-solid p-1.5 rounded-xl shadow-xl border border-white/10 flex flex-col gap-1">
          {items.map((item) => {
            const isItemActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium px-3 py-2 rounded-lg transition-all ${isItemActive ? theme.activeLink : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}