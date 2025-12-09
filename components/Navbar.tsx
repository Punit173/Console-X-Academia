// components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppData } from "@/components/AppDataContext";
import Image from "next/image";
import logo from "../public/assets/logo.jpg";
import { useState } from "react";

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

  return (
    <nav className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 w-[95%] sm:w-[90%] max-w-6xl z-50 glass rounded-2xl px-3 py-3 sm:px-6 sm:py-4 shadow-2xl shadow-black/20 transition-all duration-300">
      {/* Top row: logo + desktop nav + mobile hamburger */}
      <div className="flex items-center justify-between gap-3">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 sm:gap-3 group flex-shrink-0"
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
              CONSOLE X ACADEMIA
            </h1>
          </div>
        </Link>

        {/* Desktop / Tablet nav */}
        <div className="hidden md:flex items-center gap-2">
          <NavLink
            href="/dashboard"
            label="Dashboard"
            active={pathname === "/dashboard"}
          />
          <NavLink
            href="/marks"
            label="Marks"
            active={pathname === "/marks"}
          />
          <NavLink
            href="/attendance"
            label="Attendance"
            active={pathname === "/attendance"}
          />
          <NavLink
            href="/subjects"
            label="Subjects"
            active={pathname === "/subjects"}
          />

          <div className="w-px h-6 bg-white/10 mx-2 flex-shrink-0" />

          {/* Install Now Button */}
          <a
            href="https://play.google.com/store/apps/details?id=com.akshat.academia"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm font-bold bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 hover:shadow-lg hover:shadow-orange-500/50 transition-all duration-200 flex items-center gap-2 active:scale-95"
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>Install Now</span>
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

        {/* Mobile controls: hamburger + (optional) quick logout icon */}
        <div className="flex items-center gap-2 md:hidden">
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
              // Close icon
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
              // Hamburger icon
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

      {/* Mobile dropdown menu */}
      {isMenuOpen && (
        <div className="mt-3 border-t border-white/10 pt-3 md:hidden">
          <div className="flex flex-col gap-2">
            <NavLink
              href="/dashboard"
              label="Dashboard"
              active={pathname === "/dashboard"}
              mobile
              onClick={() => setIsMenuOpen(false)}
            />
            <NavLink
              href="/marks"
              label="Marks"
              active={pathname === "/marks"}
              mobile
              onClick={() => setIsMenuOpen(false)}
            />
            <NavLink
              href="/attendance"
              label="Attendance"
              active={pathname === "/attendance"}
              mobile
              onClick={() => setIsMenuOpen(false)}
            />
            <NavLink
              href="/subjects"
              label="Subjects"
              active={pathname === "/subjects"}
              mobile
              onClick={() => setIsMenuOpen(false)}
            />
            
            {/* Mobile Install Now Button */}
            <a
              href="https://play.google.com/store/apps/details?id=com.akshat.academia"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-4 py-2 text-sm font-bold bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 hover:shadow-lg hover:shadow-orange-500/50 transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
              onClick={() => setIsMenuOpen(false)}
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <span>Install Now</span>
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
}: {
  href: string;
  label: string;
  active: boolean;
  mobile?: boolean;
  onClick?: () => void;
}) {
  const baseClasses =
    "text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap";

  const activeClasses =
    "bg-primary/10 text-primary border border-primary/20";
  const inactiveClasses =
    "text-gray-400 hover:text-white hover:bg-white/5";

  // Mobile: make them more tappable / full-width-ish
  const mobileClasses = "w-full px-3 py-2";
  const desktopClasses = "px-3 sm:px-4 py-2";

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`${baseClasses} ${
        active ? activeClasses : inactiveClasses
      } ${mobile ? mobileClasses : desktopClasses}`}
    >
      {label}
    </Link>
  );
}
