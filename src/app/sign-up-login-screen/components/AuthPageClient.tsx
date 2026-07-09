'use client';
import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

export default function AuthPageClient({
  defaultMode = 'login',
}: {
  defaultMode?: 'login' | 'register';
}) {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>
      {/* Left brand panel */}
      <div
        className="hidden lg:flex lg:w-[45%] xl:w-[42%] flex-col justify-between p-10 xl:p-14 relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #0D0F1A 0%, #14103A 50%, #0D1A24 100%)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Background decoration */}
        <div
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 30% 20%, rgba(108,71,255,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(16,217,160,0.08) 0%, transparent 50%)',
          }}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(rgba(108,71,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(108,71,255,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <img
              src="/assets/images/app_logo.png"
              alt="GMA Logo"
              className="w-10 h-10 object-contain rounded-xl"
            />
            <div>
              <div className="font-bold text-base" style={{ color: 'var(--foreground)' }}>
                GREAT MIND ACHIEVERS
              </div>
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Empowering Success Together
              </div>
            </div>
          </div>

          <h1
            className="text-3xl xl:text-4xl font-bold leading-tight mb-4"
            style={{ color: 'var(--foreground)' }}
          >
            Build Your Network.
            <br />
            <span style={{ color: 'var(--primary)' }}>Grow Your</span>{' '}
            <span style={{ color: 'var(--accent)' }}>Wealth.</span>
          </h1>
          <p className="text-base leading-relaxed" style={{ color: 'var(--secondary-foreground)' }}>
            Join thousands of achievers building financial freedom through our proven binary network
            marketing system.
          </p>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-2 gap-4">
          {[
            { label: 'Active Members', value: '420+', icon: '👥' },
            { label: 'Total Paid Out', value: '₦2.1M+', icon: '💰' },
            { label: 'Active Coverage', value: '8 States in Nigeria', icon: '🌍' },
            { label: 'Avg. Monthly Earn', value: '₦45,000 – ₦110,000', icon: '📈' },
          ].map((stat) => (
            <div
              key={`stat-${stat.label}`}
              className="p-4 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="text-xl mb-1">{stat.icon}</div>
              <div
                className="text-xl font-bold font-mono-nums"
                style={{ color: 'var(--foreground)' }}
              >
                {stat.value}
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Testimonial */}
        <div
          className="relative z-10 p-4 rounded-xl"
          style={{ background: 'rgba(108,71,255,0.1)', border: '1px solid rgba(108,71,255,0.2)' }}
        >
          <p
            className="text-sm italic leading-relaxed mb-3"
            style={{ color: 'var(--secondary-foreground)' }}
          >
            &quot;Within 6 months, my binary team grew to 340 members and I hit Diamond rank.
            GMA&apos;s system is transparent and the payouts are always on time.&quot;
          </p>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #6C47FF 0%, #10D9A0 100%)' }}
            >
              M
            </div>
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                Michael Umeh
              </p>
              <p className="text-xs" style={{ color: 'var(--accent)' }}>
                Diamond Member · Lagos
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-10 xl:p-14 overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <img
            src="/assets/images/app_logo.png"
            alt="GMA Logo"
            className="w-8 h-8 object-contain rounded-lg"
          />
          <span className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
            GREAT MIND ACHIEVERS
          </span>
        </div>

        <div className="w-full max-w-md">
          {/* Tab switcher */}
          <div className="flex rounded-xl p-1 mb-8" style={{ background: 'var(--muted)' }}>
            {(['login', 'register'] as const).map((tab) => (
              <button
                key={`auth-tab-${tab}`}
                onClick={() => setMode(tab)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  mode === tab ? 'text-white' : ''
                }`}
                style={
                  mode === tab
                    ? {
                        background: 'linear-gradient(135deg, #6C47FF 0%, #8B6FFF 100%)',
                        boxShadow: '0 2px 12px rgba(108,71,255,0.35)',
                      }
                    : { color: 'var(--muted-foreground)' }
                }
              >
                {tab === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {mode === 'login' ? (
            <LoginForm onSwitchToRegister={() => setMode('register')} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setMode('login')} />
          )}
        </div>
      </div>
    </div>
  );
}
