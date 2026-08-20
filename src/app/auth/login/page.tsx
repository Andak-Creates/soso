'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

import LandingNav from '@/components/LandingNav';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      window.location.href = '/dashboard';
    }
  };

  const handleAppleLogin = async () => {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0514] flex flex-col font-body">

      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-violet-700/15 rounded-full blur-[120px]" />
      </div>

      <LandingNav
        authMode={true}
        authLink={{ href: '/auth/signup', label: 'No account?', highlight: 'Sign up free' }}
      />

      {/* Auth Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="font-heading text-3xl font-extrabold text-white">Welcome back</h1>
            <p className="text-sm text-white/40 mt-2">
              Log in to your Bhind host dashboard.
            </p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-8 backdrop-blur-sm">
            <form onSubmit={handleLogin} className="space-y-5">

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-white/60 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-white/60">Password</label>
                  <Link href="/auth/forgot-password" className="text-xs text-violet-400 hover:text-violet-300 transition">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-11 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3.5 font-heading text-sm font-extrabold text-white hover:bg-violet-500 disabled:opacity-60 transition shadow-lg shadow-violet-700/30 mt-2"
              >
                {loading ? (
                  <span className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Log in to Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-xs text-white/20">or continue with</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            {/* Apple SSO */}
            <button
              type="button"
              onClick={handleAppleLogin}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 py-3 text-sm font-bold text-white hover:bg-white/20 transition"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.8 3.59-.8 1.83.08 3.12.87 3.99 2.11-3.25 1.95-2.73 5.92.5 7.21-.71 1.77-1.57 3.25-3.16 3.65zm-3.2-13.06c-.19-1.89 1.15-3.66 3.03-3.87.31 2.01-1.39 3.73-3.03 3.87z" />
              </svg>
              Continue with Apple
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-white/25">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-violet-400 font-semibold hover:text-violet-300 transition">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
