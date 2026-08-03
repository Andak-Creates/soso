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

export default function LandingNav({ authMode = false, authLink }: LandingNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none ${authMode ? 'top-0' : 'top-6'}`}>
        <nav
          className={`
            pointer-events-auto flex items-center justify-between w-full
            bg-[#0f0f11]/80 backdrop-blur-xl border border-white/10
            transition-all duration-300
            ${authMode
              ? 'px-8 py-3 max-w-full rounded-none border-x-0 border-t-0'
              : `rounded-full p-1.5 pl-6 ${scrolled ? 'max-w-4xl shadow-2xl shadow-black/70' : 'max-w-6xl'}`
            }
          `}
        >
          {/* Brand */}
          <Link href="/" className="flex items-center group">
            <span className="font-brand text-2xl text-white tracking-widest group-hover:opacity-80 transition">
              soso.
            </span>
          </Link>

          {authMode ? (
            /* Auth simplified nav */
            authLink && (
              <Link href={authLink.href} className="text-xs text-white/50 hover:text-white transition">
                {authLink.label}{" "}
                <span className="text-violet-400 font-semibold">{authLink.highlight}</span>
              </Link>
            )
          ) : (
            /* Full landing nav */
            <>
              {/* Desktop links */}
              <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/5">
                {[
                  ["Features", "#features"],
                  ["How it Works", "#how-it-works"],
                  ["Pricing", "#pricing"],
                ].map(([label, href]) => (
                  <a
                    key={label}
                    href={href}
                    className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-full transition-all"
                  >
                    {label}
                  </a>
                ))}
              </div>

              {/* CTA */}
              <div className="hidden md:flex items-center gap-3 pr-1">
                <Link
                  href="/auth/login"
                  className="text-sm font-bold text-white/70 hover:text-white transition px-4"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-white text-black text-sm font-bold hover:bg-white/90 transition-transform hover:scale-105 active:scale-95"
                >
                  Get Started
                </Link>
              </div>

              {/* Mobile toggle */}
              <button
                className="md:hidden flex items-center justify-center h-10 w-10 rounded-full bg-white/10 text-white mr-1"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </>
          )}
        </nav>
      </header>

      {/* Mobile overlay */}
      {!authMode && mobileOpen && (
        <div className="fixed inset-0 z-40 bg-[#08090A] pt-28 px-6 flex flex-col">
          <div className="flex flex-col gap-6 text-3xl font-heading font-bold text-white">
            <a href="#features" onClick={() => setMobileOpen(false)}>Features</a>
            <a href="#how-it-works" onClick={() => setMobileOpen(false)}>How it Works</a>
            <a href="#pricing" onClick={() => setMobileOpen(false)}>Pricing</a>
          </div>
          <div className="mt-auto pb-12 flex flex-col gap-4">
            <Link href="/auth/login" className="py-4 text-center text-lg font-bold border border-white/20 rounded-2xl text-white" onClick={() => setMobileOpen(false)}>
              Sign In
            </Link>
            <Link href="/auth/signup" className="py-4 text-center text-lg font-bold bg-white text-black rounded-2xl" onClick={() => setMobileOpen(false)}>
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
