import React from 'react';
import Link from 'next/link';

export default function WelcomePage() {
  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden"
      style={{ background: 'var(--background)' }}
    >
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20"
          style={{ background: 'var(--primary)' }}
        ></div>
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] opacity-10"
          style={{ background: 'var(--accent)' }}
        ></div>
      </div>

      <div className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center text-center animate-fade-in">
        {/* Logo */}
        <div className="mb-8 p-3.5 bg-white/5 rounded-2xl border border-white/10 shadow-2xl hover:scale-105 transition-all duration-300">
          <img
            src="/assets/images/app_logo.png"
            alt="GreatMind Achievers Logo"
            className="w-16 h-16 object-contain"
          />
        </div>

        {/* Application Name & Value Proposition */}
        <h1
          className="text-4xl md:text-5xl font-bold mb-4 tracking-tight"
          style={{ color: 'var(--foreground)' }}
        >
          GreatMind Achievers
        </h1>
        <p className="text-lg mb-10 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
          The premier platform for network growth and digital empowerment. Build your community,
          track your progress, and achieve your financial goals.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 w-full px-4">
          <Link
            href="/sign-up-login-screen?mode=login"
            className="flex-1 btn-primary text-center py-3.5 text-[15px] shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up-login-screen?mode=register"
            className="flex-1 btn-secondary text-center py-3.5 text-[15px] hover:-translate-y-0.5 transition-transform duration-200"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
