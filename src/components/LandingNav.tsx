"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

interface LandingNavProps {
  /** If true, show auth-style simplified nav (no nav links) */
  authMode?: boolean;
  /** For auth nav: link + label for the right side */
  authLink?: { href: string; label: string; highlight: string };
}

export default function LandingNav({
  authMode = false,
  authLink,
}: LandingNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none ${authMode ? "top-0" : "top-6"}`}
      >
        <nav
          className={`
            pointer-events-auto flex items-center justify-between w-full
            bg-[#0f0f11]/80 backdrop-blur-xl border border-white/10
            transition-all duration-300
            ${
              authMode
                ? "px-8 py-3 max-w-full rounded-none border-x-0 border-t-0"
                : `rounded-full p-1.5 pl-6 ${scrolled ? "max-w-4xl shadow-2xl shadow-black/70" : "max-w-6xl"}`
            }
          `}
        >
          {/* Brand */}
          <Link href="/" className="flex items-center group">
            <span className="font-brand text-2xl text-white tracking-widest group-hover:opacity-80 transition">
              Bhind.
            </span>
          </Link>

          {authMode ? (
            /* Auth simplified nav */
            authLink && (
              <Link
                href={authLink.href}
                className="text-xs text-white/50 hover:text-white transition pr-2"
              >
                {authLink.label}{" "}
                <span className="text-violet-400 font-semibold">
                  {authLink.highlight}
                </span>
              </Link>
            )
          ) : (
            /* Clean landing nav: Brand + Action Buttons */
            <div className="flex items-center gap-2 sm:gap-4 pr-1">
              <Link
                href="/auth/login"
                className="text-xs sm:text-sm font-bold text-white/70 hover:text-white transition px-2 sm:px-4 py-2"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center h-9 sm:h-10 px-4 sm:px-5 rounded-full bg-white text-black text-xs sm:text-sm font-bold hover:bg-white/90 transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-white/10"
              >
                Get Started
              </Link>
            </div>
          )}
        </nav>
      </header>
    </>
  );
}
