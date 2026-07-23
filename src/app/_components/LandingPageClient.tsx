'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Award,
  BarChart3,
  Briefcase,
  Check,
  ChevronRight,
  Clock,
  Globe2,
  Handshake,
  HeartHandshake,
  Leaf,
  Link as LinkIcon,
  Mail,
  MapPin,
  Menu,
  Network,
  Phone,
  PiggyBank,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import LoginForm from '../sign-up-login-screen/components/LoginForm';
import RegisterForm from '../sign-up-login-screen/components/RegisterForm';
import { CompensationPlanSection } from './CompensationPlanSection';
import { CeoMessageSection } from './CeoMessageSection';
import { landingFaqs } from '@/lib/seo';

type AuthMode = null | 'login' | 'register';
type IconComponent = typeof Users;

const logoSrc = '/assets/images/app_logo.png';
const buttonFocus =
  'min-h-[44px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background';

const navLinks = [
  { href: '#about', label: 'About' },
  { href: '#benefits', label: 'Benefits' },
  { href: '#services', label: 'Programs' },
  { href: '#compensation-plan', label: 'Plan' },
  { href: '#leadership', label: 'Leadership' },
  { href: '#faq', label: 'FAQ' },
  { href: '#contact', label: 'Contact' },
];

const leadershipTeam = [
  {
    name: 'Mr Makata Hyacinth',
    role: 'Chairman',
    image: '/assets/images/Team Profiles/Mr Makata Hyacinth - Chairman.jpg',
  },
  {
    name: 'Apostle Blessing Makata',
    role: 'CEO',
    image: '/assets/images/Team Profiles/Apostle Blessing Makata - CEO.jpg',
  },
  {
    name: 'Pst Agonou Emmanuel',
    role: 'Secretary',
    image: '/assets/images/Team Profiles/Pst Agonou Emmanuel - Secretary.jpg',
  },
  {
    name: 'Ukwuegbule Onyinye Victor',
    role: 'Financial Secretary',
    image: '/assets/images/Team Profiles/Ukwuegbule Onyinye Victor - Financial Secretary.jpg',
  },
  {
    name: 'Apostle Dr Ohiambe A. Felix',
    role: 'Patron',
    image: '/assets/images/Team Profiles/Apostle Dr Ohiambe A. Felix - Patron.jpg',
  },
  {
    name: 'Pastor Mrs Esther Ohiambe',
    role: 'Matron',
    image: '/assets/images/Team Profiles/Pastor Mrs Esther Ohiambe - Matron.jpg',
  },
  {
    name: 'Bishop Chukwudi C. Enoch',
    role: 'National Mobilisation Director',
    image:
      '/assets/images/Team Profiles/Bishop Chukwudi C. Enoch -  National Mobilisation Director.jpeg',
  },
  {
    name: 'Mrs Oluchekwu Nwosu',
    role: 'Mobilization Director',
    image: '/assets/images/Team Profiles/Mrs Oluchekwu Nwosu - Mobilization Director.jpg',
  },
  {
    name: 'Onyeguma Ngozi Josephine',
    role: 'Treasurer',
    image: '/assets/images/Team Profiles/Onyeguma Ngozi Josephine - Treasurer.jpg',
  },
  {
    name: 'Mr Samuel Makata',
    role: 'Procurement Director',
    image: '/assets/images/Team Profiles/Mr Samuel Makata - Procurement Director.jpg',
  },
  {
    name: 'Mrs Helen',
    role: 'P.R,O.',
    image: '/assets/images/Team Profiles/Mrs Helen - P.R,O.jpg',
  },
];

const stats = [
  {
    icon: Users,
    value: '200+',
    label: 'Members',
    detail: 'A growing network of achievers',
    color: '#6C47FF',
  },
  {
    icon: Handshake,
    value: '30+',
    label: 'Partnerships',
    detail: 'Business and community links',
    color: '#10D9A0',
  },
  {
    icon: Globe2,
    value: '10+',
    label: 'Projects',
    detail: 'Programs across communities',
    color: '#38BDF8',
  },
  {
    icon: Star,
    value: '20+',
    label: 'Leaders',
    detail: 'Visible, accountable leadership',
    color: '#F59E0B',
  },
];

const pillars = [
  {
    icon: TrendingUp,
    title: 'Income Growth',
    body: 'Structured support for members building business, savings, and practical income paths.',
    color: '#6C47FF',
  },
  {
    icon: Leaf,
    title: 'Food Security',
    body: 'Agricultural participation designed to support households and community resilience.',
    color: '#10D9A0',
  },
  {
    icon: HeartHandshake,
    title: 'Community Care',
    body: 'Programs shaped around families, widows, orphans, and people facing hardship.',
    color: '#EF4444',
  },
  {
    icon: Award,
    title: 'Shared Standards',
    body: 'A leadership-backed network where participation, trust, and consistency matter.',
    color: '#F59E0B',
  },
];

const benefits = [
  {
    icon: BarChart3,
    title: 'Financial Confidence',
    body: 'Access a community structure that supports savings, business growth, and practical financial planning.',
    color: '#6C47FF',
  },
  {
    icon: Leaf,
    title: 'Agricultural Opportunity',
    body: 'Participate in programs connected to food security, farming, and household self-sustenance.',
    color: '#10D9A0',
  },
  {
    icon: TrendingUp,
    title: 'Economic Empowerment',
    body: 'Grow through training, mentorship, referrals, and income-generating opportunities.',
    color: '#F59E0B',
  },
  {
    icon: Users,
    title: 'Shared Prosperity',
    body: 'Build alongside members who are working toward support, stability, and collective impact.',
    color: '#38BDF8',
  },
];

const services = [
  {
    icon: Briefcase,
    title: 'Entrepreneurship Support',
    body: 'Training, mentorship, and resources for starting, managing, and growing business ideas.',
    color: '#6C47FF',
  },
  {
    icon: Network,
    title: 'Marketing Empowerment',
    body: 'Opportunities to grow through teamwork, referrals, and structured community participation.',
    color: '#10D9A0',
  },
  {
    icon: PiggyBank,
    title: 'Savings, Loans, and Support',
    body: 'Access to savings schemes, loan programs, and financial support where available.',
    color: '#F59E0B',
  },
  {
    icon: Leaf,
    title: 'Agricultural Partnerships',
    body: 'Programs focused on food security, self-sustenance, and income through agriculture.',
    color: '#10D9A0',
  },
  {
    icon: HeartHandshake,
    title: 'Community Initiatives',
    body: 'Impact programs that support families, widows, orphans, and underserved communities.',
    color: '#EF4444',
  },
  {
    icon: LinkIcon,
    title: 'Partnership Projects',
    body: 'Collaboration with organizations, communities, and institutions that support empowerment.',
    color: '#38BDF8',
  },
];

const processSteps = [
  {
    title: 'Create your member account',
    body: 'Start with a simple account and get access to the member onboarding flow.',
  },
  {
    title: 'Complete profile and verification',
    body: 'Add the details needed to participate responsibly in the community.',
  },
  {
    title: 'Join the empowerment network',
    body: 'Connect with programs, leaders, and member opportunities as they become available.',
  },
  {
    title: 'Participate and grow',
    body: 'Use teamwork, support, and community programs to build practical progress over time.',
  },
];

const contactCards = [
  {
    icon: Mail,
    label: 'Email',
    value: 'info@greatmindachievers.org',
    href: 'mailto:info@greatmindachievers.org',
    color: '#6C47FF',
  },
  {
    icon: Phone,
    label: 'Phone',
    value: '+234 706 921 1767',
    href: 'tel:+2347069211767',
    color: '#10D9A0',
  },
  {
    icon: MapPin,
    label: 'Office',
    value: 'Suite 160, Doyin Plaza, off Okoko Bus-Stop, Ojo, Lagos, Nigeria',
    color: '#F59E0B',
  },
  {
    icon: Clock,
    label: 'Hours',
    value: 'Mon-Sat: 8am-5pm\nSunday: Closed',
    color: '#38BDF8',
  },
];

function AuthModal({
  mode,
  onClose,
  onSwitch,
}: {
  mode: 'login' | 'register';
  onClose: () => void;
  onSwitch: (mode: 'login' | 'register') => void;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const titleId = 'auth-modal-title';

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.78)', backdropFilter: 'blur(8px)' }}
      onClick={(event) => {
        if (event.target === backdropRef.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-md border border-border bg-card shadow-2xl animate-slide-up motion-reduce:animate-none"
        style={{ boxShadow: '0 24px 80px rgba(0, 0, 0, 0.58)' }}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <Image
              src={logoSrc}
              alt="Great Mind Achievers logo"
              width={36}
              height={34}
              className="h-9 w-9 object-contain"
            />
            <div>
              <h2 id={titleId} className="text-sm font-semibold text-foreground">
                {mode === 'login' ? 'Member Login' : 'Create Account'}
              </h2>
              <p className="text-xs text-secondary-foreground">Great Mind Achievers</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`${buttonFocus} inline-flex min-w-[44px] items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground`}
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="px-5 pt-5">
          <div className="grid grid-cols-2 rounded-md bg-muted p-1">
            {(['login', 'register'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => onSwitch(tab)}
                className={`${buttonFocus} rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                  mode === tab
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'text-secondary-foreground hover:text-foreground'
                }`}
              >
                {tab === 'login' ? 'Login' : 'Register'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto px-5 pb-5 pt-4">
          <Suspense
            fallback={
              <div className="py-8 text-center text-sm text-secondary-foreground">Loading...</div>
            }
          >
            {mode === 'login' ? (
              <LoginForm onSwitchToRegister={() => onSwitch('register')} />
            ) : (
              <RegisterForm onSwitchToLogin={() => onSwitch('login')} />
            )}
          </Suspense>
        </div>

        <div className="border-t border-border px-5 py-3 text-center">
          <button
            type="button"
            onClick={onClose}
            className={`${buttonFocus} rounded-md px-3 text-xs text-muted-foreground transition-colors hover:text-foreground hover:underline`}
          >
            Back to landing page
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  id,
  children,
  className = '',
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-24 py-16 sm:py-20 lg:py-24 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'center',
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  align?: 'left' | 'center';
}) {
  const alignment = align === 'left' ? 'mx-0 text-left' : 'mx-auto text-center';

  return (
    <div className={`mb-10 max-w-3xl sm:mb-12 ${alignment}`}>
      <p className="mb-3 text-sm font-semibold text-accent">{eyebrow}</p>
      <h2 className="text-3xl font-bold leading-tight text-foreground text-balance sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-secondary-foreground sm:text-lg">
        {subtitle}
      </p>
    </div>
  );
}

function IconTile({ icon: Icon, color }: { icon: IconComponent; color: string }) {
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border"
      style={{ backgroundColor: `${color}14`, borderColor: `${color}33`, color }}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
  color,
  className = '',
}: {
  icon: IconComponent;
  title: string;
  body: string;
  color: string;
  className?: string;
}) {
  return (
    <div
      className={`group h-full rounded-md border border-border bg-card p-5 shadow-sm transition duration-200 hover:border-primary motion-safe:hover:-translate-y-1 ${className}`}
    >
      <IconTile icon={icon} color={color} />
      <h3 className="mt-5 text-lg font-semibold leading-snug text-foreground">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-secondary-foreground">{body}</p>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className={`${buttonFocus} inline-flex items-center rounded-md px-1 text-sm font-medium text-secondary-foreground transition-colors hover:text-foreground`}
    >
      {label}
    </a>
  );
}

export default function LandingPageClient() {
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeAuth = useCallback(() => setAuthMode(null), []);
  const openLogin = useCallback(() => {
    setAuthMode('login');
    setMobileMenuOpen(false);
  }, []);
  const openRegister = useCallback(() => {
    setAuthMode('register');
    setMobileMenuOpen(false);
  }, []);

  return (
    <>
      {authMode && (
        <AuthModal mode={authMode} onClose={closeAuth} onSwitch={(mode) => setAuthMode(mode)} />
      )}

      <div className="min-h-screen bg-background text-foreground">
        <header
          className="sticky top-0 z-40 border-b border-border"
          style={{ background: 'rgba(13, 15, 26, 0.94)', backdropFilter: 'blur(14px)' }}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between gap-4">
              <Link
                href="/"
                className={`${buttonFocus} flex items-center gap-3 rounded-md`}
                aria-label="Great Mind Achievers home"
              >
                <Image
                  src={logoSrc}
                  alt="Great Mind Achievers logo"
                  width={42}
                  height={40}
                  className="h-10 w-10 object-contain"
                />
                <span className="hidden sm:block">
                  <span className="block text-sm font-bold leading-none text-foreground">
                    Great Mind Achievers
                  </span>
                  <span className="mt-1 block text-xs text-accent">
                    Empowering Success Together
                  </span>
                </span>
              </Link>

              <nav className="hidden items-center gap-5 lg:flex" aria-label="Main navigation">
                {navLinks.map((link) => (
                  <NavLink key={link.href} {...link} />
                ))}
              </nav>

              <div className="hidden items-center gap-3 lg:flex">
                <button
                  type="button"
                  onClick={openLogin}
                  id="nav-login-btn"
                  className={`${buttonFocus} btn-secondary px-5 py-2 text-sm`}
                  aria-label="Sign in to your account"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={openRegister}
                  id="nav-register-btn"
                  className={`${buttonFocus} btn-primary px-5 py-2 text-sm`}
                  aria-label="Create a new account"
                >
                  Create Account
                </button>
              </div>

              <button
                type="button"
                className={`${buttonFocus} inline-flex min-w-[44px] items-center justify-center rounded-md text-foreground transition-colors hover:bg-white/5 lg:hidden`}
                onClick={() => setMobileMenuOpen((open) => !open)}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Menu className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>

            {mobileMenuOpen && (
              <nav
                id="mobile-menu"
                className="border-t border-border py-4 lg:hidden animate-fade-in motion-reduce:animate-none"
                aria-label="Mobile navigation"
              >
                <div className="flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`${buttonFocus} rounded-md px-3 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-white/5 hover:text-foreground`}
                    >
                      {link.label}
                    </a>
                  ))}
                  <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3">
                    <button
                      type="button"
                      onClick={openLogin}
                      id="mobile-login-btn"
                      className={`${buttonFocus} btn-secondary px-4 py-2.5 text-sm`}
                      aria-label="Sign in to your account"
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={openRegister}
                      id="mobile-register-btn"
                      className={`${buttonFocus} btn-primary px-4 py-2.5 text-sm`}
                      aria-label="Create a new account"
                    >
                      Create Account
                    </button>
                  </div>
                </div>
              </nav>
            )}
          </div>
        </header>

        <main>
          <section
            className="relative overflow-hidden border-b border-border"
            style={{
              background: 'linear-gradient(135deg, #0d0f1a 0%, #111827 45%, #171323 100%)',
            }}
            aria-labelledby="hero-heading"
          >
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute inset-0 opacity-[0.08]"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)',
                  backgroundSize: '56px 56px',
                }}
              />
            </div>

            <div className="relative z-10 mx-auto grid min-h-[72svh] max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:px-8 lg:py-24">
              <div className="max-w-2xl animate-slide-up motion-reduce:animate-none">
                <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-accent">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Empowerment, agriculture, and shared prosperity
                </div>

                <h1
                  id="hero-heading"
                  className="text-4xl font-bold leading-tight text-foreground text-balance sm:text-5xl lg:text-6xl"
                >
                  Great Mind Achievers
                </h1>

                <p className="mt-6 text-lg leading-relaxed text-secondary-foreground sm:text-xl">
                  A trusted Nigerian empowerment community helping members build income, access
                  support, participate in agricultural and business opportunities, and grow through
                  teamwork.
                </p>
              </div>

              <div
                className="relative w-full overflow-hidden rounded-3xl shadow-2xl border border-white/10 aspect-[4/3] lg:aspect-[16/11] animate-slide-up motion-reduce:animate-none"
                style={{ animationDelay: '150ms' }}
              >
                <Image
                  src="/assets/images/2025/Hero Section Image.jpg"
                  alt="Great Mind Achievers community leadership"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center"
                />
              </div>
            </div>
          </section>

          <section className="border-b border-border bg-card" aria-label="GMA trust metrics">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-md border border-border bg-background p-5 transition duration-200 hover:border-primary"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <IconTile icon={stat.icon} color={stat.color} />
                      <p className="font-mono-nums text-3xl font-bold text-foreground">
                        {stat.value}
                      </p>
                    </div>
                    <p className="mt-4 text-base font-semibold text-foreground">{stat.label}</p>
                    <p className="mt-1 text-sm leading-relaxed text-secondary-foreground">
                      {stat.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <Section id="about">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div>
                <SectionHeader
                  eyebrow="About GMA"
                  title="A practical community for people building real progress."
                  subtitle="Great Mind Achievers brings together empowerment, agriculture, financial inclusion, and accountable leadership so members can move from effort to structured opportunity."
                  align="left"
                />
                <button
                  type="button"
                  onClick={openRegister}
                  id="about-join-btn"
                  className={`${buttonFocus} btn-primary px-6 py-3 text-sm font-semibold`}
                  aria-label="Join the GMA community"
                >
                  Join the Community
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {pillars.map((pillar) => (
                  <FeatureCard key={pillar.title} {...pillar} />
                ))}
              </div>
            </div>
          </Section>

          <Section className="border-y border-border bg-secondary">
            <SectionHeader
              eyebrow="Mission and vision"
              title="Built for household stability, food security, and shared value."
              subtitle="The mission is not abstract: help everyday Nigerians access support, build sustainable income, and participate in programs that strengthen families and communities."
            />

            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-md border border-border bg-card p-6 sm:p-8">
                <IconTile icon={Globe2} color="#6C47FF" />
                <h3 className="mt-5 text-2xl font-bold text-foreground">
                  A Nigeria where every household can thrive.
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-secondary-foreground sm:text-base">
                  GMA promotes self-sustenance, agricultural partnerships, and economic empowerment
                  so more households can move toward food security and financial stability.
                </p>
              </div>
              <div className="rounded-md border border-border bg-card p-6 sm:p-8">
                <IconTile icon={Wallet} color="#10D9A0" />
                <h3 className="mt-5 text-2xl font-bold text-foreground">
                  Members empowered to build lasting value.
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-secondary-foreground sm:text-base">
                  Members gain access to savings, business support, agricultural participation, and
                  community-driven programs designed to improve lives over time.
                </p>
              </div>
            </div>
          </Section>

          <Section id="impact" className="border-y border-border bg-card">
            <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-white/10 shadow-xl border border-white/5">
                    <Image
                      src="/assets/images/2025/Leader with women meeting..jpg"
                      alt="Leader with women meeting"
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover object-center"
                    />
                  </div>
                  <div className="relative aspect-square overflow-hidden rounded-3xl bg-white/10 shadow-xl border border-white/5">
                    <Image
                      src="/assets/images/2025/Leader with women at event..jpg"
                      alt="Leader with women at event"
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover object-center"
                    />
                  </div>
                </div>
                <div className="relative mt-8 aspect-[3/4] overflow-hidden rounded-3xl bg-white/10 shadow-xl border border-white/5">
                  <Image
                    src="/assets/images/2025/Leader with beneficiaries.jpg"
                    alt="Leader with beneficiaries"
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover object-center"
                  />
                </div>
              </div>
              <div className="px-4">
                <SectionHeader
                  eyebrow="Community Impact"
                  title="Empowering Women and Transforming Communities."
                  subtitle="Real leadership means being on the ground. GMA actively engages with beneficiaries, supporting women's development and fostering community resilience through hands-on involvement and targeted empowerment programs."
                  align="left"
                />
                <ul className="mt-8 space-y-5">
                  {[
                    'Supporting local women entrepreneurs',
                    'Direct community engagement and mentorship',
                    'Building sustainable livelihoods for families',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                        <Check className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <span className="text-base font-medium text-secondary-foreground">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>

          <Section id="benefits">
            <SectionHeader
              eyebrow="Why members join"
              title="Support that feels structured, local, and human."
              subtitle="The strongest value of GMA is the combination of practical programs, leadership visibility, and a community that grows through teamwork."
            />
            <div className="grid gap-6 sm:grid-cols-2">
              {benefits.map((benefit) => (
                <FeatureCard key={benefit.title} {...benefit} />
              ))}
            </div>
          </Section>

          <CeoMessageSection />

          <Section id="services" className="border-y border-border bg-secondary">
            <SectionHeader
              eyebrow="Member programs"
              title="What members can access."
              subtitle="A focused set of programs and opportunities supports business growth, financial support, agriculture, and community impact."
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <FeatureCard key={service.title} {...service} />
              ))}
            </div>
          </Section>

          <CompensationPlanSection />

          <Section id="how-it-works">
            <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
              <SectionHeader
                eyebrow="How it works"
                title="A clear path from interest to participation."
                subtitle="The onboarding journey stays simple and action-oriented so new members know exactly what happens next."
                align="left"
              />

              <div className="space-y-4">
                {processSteps.map((step, index) => (
                  <div
                    key={step.title}
                    className="grid gap-4 rounded-md border border-border bg-card p-5 sm:grid-cols-[auto_1fr_auto] sm:items-start"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-secondary-foreground">
                        {step.body}
                      </p>
                    </div>
                    <Check className="hidden h-5 w-5 text-accent sm:block" aria-hidden="true" />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={openRegister}
                  id="how-it-works-cta-btn"
                  className={`${buttonFocus} btn-primary w-full px-8 py-4 text-base font-semibold sm:w-auto`}
                  aria-label="Get started with GMA"
                >
                  Get Started Today
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </Section>

          <Section id="leadership" className="border-y border-border bg-secondary">
            <SectionHeader
              eyebrow="Leadership"
              title="Meet the people guiding the GMA mission."
              subtitle="Trust grows when leadership is visible. GMA is guided by a team committed to empowerment, accountability, community development, and sustainable growth."
            />
            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {leadershipTeam.map((leader) => (
                <article
                  key={leader.name}
                  className="group rounded-md border border-border bg-card p-3 transition duration-200 hover:border-primary motion-safe:hover:-translate-y-1"
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-muted">
                    <Image
                      src={leader.image}
                      alt={`${leader.name}, ${leader.role}`}
                      fill
                      sizes="(max-width: 640px) 92vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover object-center transition duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
                    />
                  </div>
                  <div className="px-1 pb-2 pt-4">
                    <h3 className="text-base font-bold leading-snug text-foreground">
                      {leader.name}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-accent">{leader.role}</p>
                  </div>
                </article>
              ))}
            </div>
          </Section>

          <Section id="faq" className="border-y border-border bg-card">
            <SectionHeader
              eyebrow="Common questions"
              title="Helpful answers before joining GMA."
              subtitle="These answers summarize the core membership path, available programs, and contact details for people evaluating Great Mind Achievers."
            />
            <div className="mx-auto grid max-w-4xl gap-4">
              {landingFaqs.map((faq) => (
                <article
                  key={faq.question}
                  className="rounded-md border border-border bg-background p-5"
                >
                  <h3 className="text-base font-semibold leading-snug text-foreground">
                    {faq.question}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-secondary-foreground">
                    {faq.answer}
                  </p>
                </article>
              ))}
            </div>
          </Section>

          <Section id="contact">
            <SectionHeader
              eyebrow="Contact"
              title="Questions before joining? Talk to the team."
              subtitle="Reach GMA through email, phone, or the Lagos office for guidance on membership, programs, and participation."
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {contactCards.map((contact) => (
                <div key={contact.label} className="rounded-md border border-border bg-card p-5">
                  <IconTile icon={contact.icon} color={contact.color} />
                  <h3 className="mt-5 text-sm font-semibold text-accent">{contact.label}</h3>
                  {contact.href ? (
                    <a
                      href={contact.href}
                      className={`${buttonFocus} mt-2 inline-flex rounded-md text-sm leading-relaxed text-foreground transition-colors hover:text-accent hover:underline`}
                    >
                      {contact.value}
                    </a>
                  ) : (
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground">
                      {contact.value}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Section>

          <section
            className="relative overflow-hidden border-t border-border py-16 sm:py-20"
            style={{
              background: 'linear-gradient(135deg, #0d0f1a 0%, #151b2f 50%, #101820 100%)',
            }}
            aria-labelledby="final-cta-heading"
          >
            <Image
              src={logoSrc}
              alt=""
              width={514}
              height={486}
              aria-hidden="true"
              className="pointer-events-none absolute -right-12 top-6 hidden h-auto w-64 opacity-10 sm:block"
            />
            <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
              <p className="mb-3 text-sm font-semibold text-accent">Ready to begin?</p>
              <h2
                id="final-cta-heading"
                className="text-3xl font-bold leading-tight text-foreground text-balance sm:text-4xl"
              >
                Become a Great Mind Achiever today.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-secondary-foreground sm:text-lg">
                Create your account and take the first step into a community built around teamwork,
                empowerment, accountability, and shared prosperity.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={openRegister}
                  id="final-cta-register-btn"
                  className={`${buttonFocus} btn-primary px-10 py-4 text-base font-semibold`}
                  aria-label="Register for a GMA account"
                >
                  Register Now
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={openLogin}
                  id="final-cta-login-btn"
                  className={`${buttonFocus} btn-secondary px-10 py-4 text-base font-semibold`}
                  aria-label="Member login"
                >
                  Member Login
                </button>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-border bg-card py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex items-center gap-3">
                <Image
                  src={logoSrc}
                  alt="Great Mind Achievers logo"
                  width={30}
                  height={28}
                  className="h-7 w-7 object-contain"
                />
                <span className="text-sm font-semibold text-foreground">Great Mind Achievers</span>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Copyright {new Date().getFullYear()} Great Mind Achievers. All rights reserved.
              </p>
              <Link
                href="/"
                className={`${buttonFocus} inline-flex items-center gap-1 rounded-md text-xs text-accent transition-colors hover:text-foreground hover:underline`}
              >
                greatmindachievers.org
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
