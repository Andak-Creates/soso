'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';

import LandingNav from '@/components/LandingNav';

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    
    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: orgName,
          phone: phone,
        }
      }
    });
    
    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      // Typically create the Brand here, but for now we'll just redirect to dashboard
      window.location.href = '/dashboard';
    }
  };

  const handleAppleSignup = async () => {
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
        authLink={{ href: '/auth/login', label: 'Already have an account?', highlight: 'Log in' }}
      />

      {/* Auth Container */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className={`flex items-center gap-2 text-xs font-bold ${step >= 1 ? 'text-violet-400' : 'text-white/20'}`}>
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-extrabold ${step > 1 ? 'bg-violet-600 text-white' : step === 1 ? 'border-2 border-violet-500 text-violet-400' : 'border-2 border-white/10 text-white/20'}`}>
                {step > 1 ? <CheckCircle2 className="h-3.5 w-3.5" /> : '1'}
              </div>
              Account
            </div>
            <div className={`h-px w-10 ${step === 2 ? 'bg-violet-500' : 'bg-white/10'}`} />
            <div className={`flex items-center gap-2 text-xs font-bold ${step === 2 ? 'text-violet-400' : 'text-white/20'}`}>
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-extrabold ${step === 2 ? 'border-2 border-violet-500 text-violet-400' : 'border-2 border-white/10 text-white/20'}`}>
                2
              </div>
              Organisation
            </div>
          </div>

          {/* Step 1: Account Details */}
          {step === 1 && (
            <>
              <div className="text-center mb-8">
                <h1 className="font-heading text-3xl font-extrabold text-white">Create your account</h1>
                <p className="text-sm text-white/40 mt-2">
                  Free forever. No credit card required.
                </p>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-8 backdrop-blur-sm">
                <form onSubmit={handleStep1} className="space-y-5">

                  <div>
                    <label className="block text-xs font-bold text-white/60 mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-white/60 mb-1.5">Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        placeholder="At least 8 characters"
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

                    {/* Password strength indicator */}
                    {password.length > 0 && (
                      <div className="mt-2 flex gap-1">
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
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3.5 font-heading text-sm font-extrabold text-white hover:bg-violet-500 transition shadow-lg shadow-violet-700/30 mt-2"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>

                <div className="my-6 flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-xs text-white/20">or</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>

                {/* Apple SSO */}
                <button
                  type="button"
                  onClick={handleAppleSignup}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 py-3 text-sm font-bold text-white hover:bg-white/20 transition"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.8 3.59-.8 1.83.08 3.12.87 3.99 2.11-3.25 1.95-2.73 5.92.5 7.21-.71 1.77-1.57 3.25-3.16 3.65zm-3.2-13.06c-.19-1.89 1.15-3.66 3.03-3.87.31 2.01-1.39 3.73-3.03 3.87z" />
                  </svg>
                  Continue with Apple
                </button>
              </div>

              <p className="mt-5 text-center text-[11px] text-white/20 leading-relaxed">
                By signing up you agree to our{' '}
                <a href="#" className="text-white/40 underline hover:text-white/60">Terms of Use</a>{' '}
                and{' '}
                <a href="#" className="text-white/40 underline hover:text-white/60">Privacy Policy</a>.
              </p>
            </>
          )}

          {/* Step 2: Organisation Details */}
          {step === 2 && (
            <>
              <div className="text-center mb-8">
                <h1 className="font-heading text-3xl font-extrabold text-white">About your organisation</h1>
                <p className="text-sm text-white/40 mt-2">
                  Help guests and attendees know who they are buying from.
                </p>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-8 backdrop-blur-sm">
                <form onSubmit={handleSignup} className="space-y-5">

                  <div>
                    <label className="block text-xs font-bold text-white/60 mb-1.5">Organisation / Promoter Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. TheScene Nightlife LLC"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition"
                    />
                    <p className="text-[10px] text-white/25 mt-1">This appears on tickets and guest receipts.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-white/60 mb-1.5">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+234 xxx xxxx xxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition"
                    />
                    <p className="text-[10px] text-white/25 mt-1">Used for account verification and support.</p>
                  </div>

                  {/* Plan Selection */}
                  <div>
                    <label className="block text-xs font-bold text-white/60 mb-3">Choose your starting plan</label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="relative rounded-xl border border-emerald-500/30 bg-emerald-600/10 p-4 cursor-pointer">
                        <input type="radio" name="plan" value="free" defaultChecked className="sr-only peer" />
                        <div className="text-xs font-extrabold text-emerald-300">Free Plan</div>
                        <div className="text-[11px] text-white/40 mt-1">80 guests · 5% fee</div>
                        <div className="font-heading text-lg font-extrabold text-white mt-2">₦ 0</div>
                        <div className="absolute top-3 right-3 h-3 w-3 rounded-full border-2 border-emerald-500 bg-emerald-500" />
                      </label>
                      <label className="relative rounded-xl border border-violet-500/30 bg-violet-600/10 p-4 cursor-pointer hover:border-violet-400/60 transition">
                        <input type="radio" name="plan" value="pro" className="sr-only peer" />
                        <div className="flex items-center gap-1.5">
                          <div className="text-xs font-extrabold text-violet-300">Pro Plan</div>
                          <span className="rounded bg-violet-600 px-1 py-0.5 text-[8px] font-extrabold text-white">PRO</span>
                        </div>
                        <div className="text-[11px] text-white/40 mt-1">Unlimited · 3% fee</div>
                        <div className="font-heading text-lg font-extrabold text-white mt-2">₦ 15K/mo</div>
                        <div className="absolute top-3 right-3 h-3 w-3 rounded-full border-2 border-white/20" />
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 font-heading text-xs font-bold text-white/60 hover:bg-white/10 hover:text-white transition"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-[2] inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3.5 font-heading text-sm font-extrabold text-white hover:bg-violet-500 disabled:opacity-60 transition shadow-lg shadow-violet-700/30"
                    >
                      {loading ? (
                        <span className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          Create Account
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
