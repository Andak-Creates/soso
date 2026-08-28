'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import LandingNav from '@/components/LandingNav';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }
    
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      // Clean username to satisfy schema: alphanumeric, 3 to 30 characters, unique
      const baseCleanName = fullName.trim().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'host';
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const cleanUsername = `${baseCleanName}${randomSuffix}`.slice(0, 30);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            username: cleanUsername,
            is_host: true,
          }
        }
      });
      
      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        const userId = data.user.id;
        const brandName = fullName.trim();

        // 1. Auto-create their default Host Profile so they can immediately create events
        try {
          await supabase.from('host_profiles').insert({
            owner_id: userId,
            name: brandName,
            is_verified: false,
          });
        } catch (profileErr) {
          console.warn('Host profile auto-creation notice:', profileErr);
        }

        // 2. Auto-initialize their host balances
        try {
          await supabase.from('host_balances').insert({
            user_id: userId,
            total_earned: 0,
            pending_payout: 0,
            total_withdrawn: 0,
            available_balance: 0,
            currency: 'NGN',
          });
        } catch (balanceErr) {
          console.warn('Host balance auto-creation notice:', balanceErr);
        }
      }
      
      window.location.href = '/dashboard';
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#08090A] flex flex-col font-body text-[#F9FAFB] selection:bg-violet-500/30 overflow-x-hidden">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-900/10 rounded-full blur-[130px]" />
      </div>

      <LandingNav
        authMode={true}
        authLink={{ href: '/auth/login', label: 'Already have an account?', highlight: 'Log in' }}
      />

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-24 sm:py-28">
        <div className="w-full max-w-md">

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="font-heading text-3xl sm:text-4xl font-black text-white tracking-tight">
              Create an account
            </h1>
            <p className="text-sm text-white/50 mt-2">
              Start creating events and selling tickets
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#111113] p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-xl">
            {errorMessage && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                  Host / Brand Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kelvin Events or TheScene Nightlife"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500 focus:bg-white/[0.07] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500 focus:bg-white/[0.07] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 pr-11 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500 focus:bg-white/[0.07] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition p-1"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {password.length > 0 && (
                  <div className="mt-2.5 flex gap-1.5">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition ${
                          password.length > i * 3
                            ? password.length >= 12
                              ? 'bg-emerald-500'
                              : password.length >= 8
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                            : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-white text-black py-4 font-heading text-sm font-bold hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition shadow-xl mt-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-black" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="mt-8 text-center text-xs text-white/40">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-violet-400 font-bold hover:text-violet-300 transition">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
