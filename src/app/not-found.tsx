'use client';

import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#08090A] text-[#F9FAFB] flex flex-col items-center justify-center text-center px-4 font-body">
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <div className="absolute w-[400px] h-[400px] bg-violet-600/20 rounded-full blur-[100px] mix-blend-screen" />
      </div>

      <div className="font-heading text-9xl font-black text-white/10 mb-4">404</div>
      <h1 className="font-heading text-4xl font-bold mb-4">Page Not Found</h1>
      <p className="text-[#888888] max-w-sm mb-8">
        We couldn't find the page you're looking for. It might have been moved or deleted.
      </p>

      <Link 
        href="/"
        className="px-6 py-3 rounded-full bg-white text-black font-bold hover:scale-105 transition-transform"
      >
        Back to Home
      </Link>
    </div>
  );
}
