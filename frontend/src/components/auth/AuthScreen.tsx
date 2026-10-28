'use client';

import React, { useState, useEffect } from 'react';
import { Tenant, User, UserRole } from '@/lib/api';
import { ApiClient } from '@/lib/api';

interface SlideItem {
  image: string;
  author: string;
  role: string;
  org: string;
  quote: string;
}

const CAROUSEL_SLIDES: SlideItem[] = [
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuANA_wQOiNVfpXXU_LeNza4SHE2PAprGCKwIZlMLxYrgQUG2iEsIKhIBmJEHhlo1nZ5DkCc47H4L5nI0QhdmC-jQPxZacKQhJXZ6v9gnBHx8-h74wfDMRUa9C4Z92Kw6ccCTxW3nm_QK8XEl1OqGNTYhVCN6NLaf-ai19vYx_twj7PA_eYZyKnewdD4WmOWZv-w4TYkooTJ9gX79f_SVjbFaFQLvqyaFiTaFbfiCDUdpHJjvDZwJ9wZ5Q',
    author: 'Kenji T.',
    role: 'Fleet Operations Director',
    org: 'UTokyo Campus Transit',
    quote: "“Managing multi-route campus shuttle telemetry across congested avenues has been seamless with sub-second radar updates.”",
  },
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8i_TL6D8X3e85sNTtjHS2udpkhkZR8W6iGtp0hZopz6HJY9PN4iRQD572Tc0GvvrBhXTt3jQ4_6tVsQoOdWGnA4MYt5Q0uL93YSQmW_hmV93_zczaA6NCDIaGO42uvuR4P94H3sUskl879n9Y2HWk2MUTzIJ6_K0CZwyR5XhvUNeWC85l5luFx-MTo5fSFd2aLqP70aitrtYPEFlftomTHDmzUqwEHrboH2Owt03QB3vW-WQ5JJ_k9g',
    author: 'Prof. Noor Azuan',
    role: 'Transport Operations Lead',
    org: 'Universiti Malaya Shuttle',
    quote: "“The isolated multi-tenant architecture keeps our student commuters, drivers, and operations radar completely synchronized.”",
  },
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBjFxyfS_7YRRRBeD-Qx8mQ2KrgdfGbxBZbChVQHv4dUQElmItsskwEiXoF3tqyOy4HfRiQ206Mms7FSi_DvtBa1C6NV_fkqtAwbBtP0ek9CoixBxr05NuN3-f9cTCSDYjXKFuRwcV88F5YXbvVqovt08k4ai5QZXq4ZhkCB2dwZ01RADxZ8WiiWcvIIYJmxpFDF19tJDgVPVQsBHvLcF98FCfY3rEUo-ILcqcTK6h7Mgx1AMU7JbUsbw',
    author: 'Dr. Evelyn Tan',
    role: 'Campus Mobility Coordinator',
    org: 'NUS Campus Shuttle',
    quote: "“Live vehicle clustering and real-time seat locks prevent overcrowding across our internal shuttle network.”",
  },
];

interface DemoAccount {
  roleLabel: string;
  role: UserRole;
  email: string;
  password: string;
}

interface UniversityDemoGroup {
  tenantId: string;
  universityName: string;
  location: string;
  accounts: DemoAccount[];
}

const UNIVERSITY_DEMOS: UniversityDemoGroup[] = [
  {
    tenantId: '11111111-1111-1111-1111-111111111111',
    universityName: 'Universiti Malaya Shuttle',
    location: 'Kuala Lumpur, Malaysia',
    accounts: [
      { roleLabel: 'Operator Admin', role: 'OPERATOR_ADMIN', email: 'admin@um.edu.my', password: 'UM@Admin2026' },
      { roleLabel: 'Transit Driver', role: 'DRIVER', email: 'driver@um.edu.my', password: 'UM@Driver2026' },
      { roleLabel: 'Student Rider', role: 'RIDER', email: 'student@um.edu.my', password: 'UM@Student2026' },
    ],
  },
  {
    tenantId: '22222222-2222-2222-2222-222222222222',
    universityName: 'NUS Campus Shuttle',
    location: 'Singapore',
    accounts: [
      { roleLabel: 'Operator Admin', role: 'OPERATOR_ADMIN', email: 'admin@u.nus.edu', password: 'NUS@Admin2026' },
      { roleLabel: 'Transit Driver', role: 'DRIVER', email: 'driver@u.nus.edu', password: 'NUS@Driver2026' },
      { roleLabel: 'Student Rider', role: 'RIDER', email: 'student@u.nus.edu', password: 'NUS@Student2026' },
    ],
  },
  {
    tenantId: '33333333-3333-3333-3333-333333333333',
    universityName: 'UTokyo Campus Transit',
    location: 'Tokyo, Japan',
    accounts: [
      { roleLabel: 'Operator Admin', role: 'OPERATOR_ADMIN', email: 'admin@u-tokyo.ac.jp', password: 'UTK@Admin2026' },
      { roleLabel: 'Transit Driver', role: 'DRIVER', email: 'driver@u-tokyo.ac.jp', password: 'UTK@Driver2026' },
      { roleLabel: 'Student Rider', role: 'RIDER', email: 'student@u-tokyo.ac.jp', password: 'UTK@Student2026' },
    ],
  },
  {
    tenantId: '44444444-4444-4444-4444-444444444444',
    universityName: 'IIT Delhi Campus Transit',
    location: 'New Delhi, India',
    accounts: [
      { roleLabel: 'Operator Admin', role: 'OPERATOR_ADMIN', email: 'admin@iitd.ac.in', password: 'IITD@Admin2026' },
      { roleLabel: 'Transit Driver', role: 'DRIVER', email: 'driver@iitd.ac.in', password: 'IITD@Driver2026' },
      { roleLabel: 'Student Rider', role: 'RIDER', email: 'student@iitd.ac.in', password: 'IITD@Student2026' },
    ],
  },
  {
    tenantId: '55555555-5555-5555-5555-555555555555',
    universityName: 'IISc Bangalore Green Shuttle',
    location: 'Bengaluru, India',
    accounts: [
      { roleLabel: 'Operator Admin', role: 'OPERATOR_ADMIN', email: 'admin@iisc.ac.in', password: 'IISC@Admin2026' },
      { roleLabel: 'Transit Driver', role: 'DRIVER', email: 'driver@iisc.ac.in', password: 'IISC@Driver2026' },
      { roleLabel: 'Student Rider', role: 'RIDER', email: 'student@iisc.ac.in', password: 'IISC@Student2026' },
    ],
  },
];

interface AuthScreenProps {
  tenants: Tenant[];
  api: ApiClient;
  onAuthSuccess: (user: User, token: string) => void;
}

export function AuthScreen({ tenants, api, onAuthSuccess }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [selectedDemoUni, setSelectedDemoUni] = useState<string>(UNIVERSITY_DEMOS[0].tenantId);
  const [email, setEmail] = useState<string>('admin@um.edu.my');
  const [password, setPassword] = useState<string>('UM@Admin2026');
  const [fullName, setFullName] = useState<string>('');
  const [tenantId, setTenantId] = useState<string>(UNIVERSITY_DEMOS[0].tenantId);
  const [role, setRole] = useState<UserRole>('OPERATOR_ADMIN');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  useEffect(() => {
    if (tenants.length > 0 && !tenantId) {
      setTenantId(tenants[0].id);
    }
  }, [tenants, tenantId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectDemoAccount = (demo: DemoAccount, uniTenantId: string) => {
    setSelectedDemoUni(uniTenantId);
    setTenantId(uniTenantId);
    setEmail(demo.email);
    setPassword(demo.password);
    setErrorMessage('');
  };

  const handleSelectUniGroup = (newTenantId: string) => {
    setSelectedDemoUni(newTenantId);
    setTenantId(newTenantId);
    const grp = UNIVERSITY_DEMOS.find((u) => u.tenantId === newTenantId);
    if (grp && grp.accounts.length > 0) {
      setEmail(grp.accounts[0].email);
      setPassword(grp.accounts[0].password);
    }
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      if (isSignUp) {
        const res = await api.signUp({
          email: email.trim(),
          password,
          tenant_id: tenantId,
          role,
          full_name: fullName.trim() || undefined,
        });
        api.setToken(res.token);
        if (typeof window !== 'undefined') {
          localStorage.setItem('nextransit_auth', JSON.stringify({ token: res.token, user: res.user }));
          localStorage.setItem('transit_auth_token', res.token);
        }
        onAuthSuccess(res.user, res.token);
      } else {
        const res = await api.login({
          email: email.trim(),
          password,
          tenant_id: tenantId || undefined,
        });
        api.setToken(res.token);
        if (typeof window !== 'undefined') {
          localStorage.setItem('nextransit_auth', JSON.stringify({ token: res.token, user: res.user }));
          localStorage.setItem('transit_auth_token', res.token);
        }
        onAuthSuccess(res.user, res.token);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const activeQuote = CAROUSEL_SLIDES[currentSlide];
  const activeUniGroup = UNIVERSITY_DEMOS.find((u) => u.tenantId === selectedDemoUni) || UNIVERSITY_DEMOS[0];

  return (
    <div className="bg-[#F7F6F2] min-h-screen flex items-center justify-center p-0 md:p-6 lg:p-10 font-sans text-neutral-900 antialiased selection:bg-neutral-900 selection:text-white">
      <main className="w-full max-w-[1240px] min-h-screen md:min-h-[820px] md:h-[820px] max-h-[960px] bg-white md:rounded-[28px] shadow-2xl overflow-hidden flex flex-col md:flex-row relative border border-neutral-200/80">
        <section className="w-full md:w-1/2 h-full flex flex-col justify-between p-6 sm:p-8 lg:p-10 relative z-10 overflow-y-auto bg-white [background-image:radial-gradient(rgba(17,24,39,0.08)_1px,transparent_1px)] [background-size:18px_18px]">
          <svg className="absolute -top-7 -left-7 w-56 h-56 text-black opacity-[0.035] pointer-events-none select-none" fill="currentColor" viewBox="0 0 100 100">
            <rect height="90" rx="3" width="6" x="47" y="5" />
            <rect height="6" rx="3" width="90" x="5" y="47" />
            <rect height="90" rx="3" transform="rotate(45 50 50)" width="6" x="47" y="5" />
            <rect height="90" rx="3" transform="rotate(-45 50 50)" width="6" x="47" y="5" />
          </svg>

          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 text-neutral-900">
              <div className="w-8 h-8 rounded-xl bg-[#162A22] text-white flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect height="20" rx="1" width="2" x="11" y="2" />
                  <rect height="2" rx="1" width="20" x="2" y="11" />
                  <rect height="20" rx="1" transform="rotate(45 12 12)" width="2" x="11" y="2" />
                  <rect height="20" rx="1" transform="rotate(-45 12 12)" width="2" x="11" y="2" />
                </svg>
              </div>
              <span className="font-semibold tracking-tight text-sm text-[#162A22]">NexTransit Fleet</span>
            </div>
            <span className="text-[11px] font-medium text-neutral-600 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200">
              Multi-tenant grid
            </span>
          </div>

          <div className="w-full max-w-[380px] mx-auto py-2">
            <div className="text-center mb-5">
              <h1 className="text-[22px] sm:text-[23px] font-bold tracking-tight text-[#162A22] mb-1">
                {isSignUp ? 'Create university transit account' : 'Sign into workspace'}
              </h1>
              <p className="text-xs text-neutral-500 font-normal leading-relaxed max-w-[320px] mx-auto">
                {isSignUp
                  ? 'Register into an isolated campus workspace with role-based dispatch privileges.'
                  : 'Isolated multi-tenant authentication with dedicated role access.'}
              </p>
            </div>

            {!isSignUp && (
              <div className="mb-4 bg-[#FBFBFA] border border-neutral-200/90 rounded-2xl p-3 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-neutral-700">
                    Quick demo credentials
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    5 university networks
                  </span>
                </div>

                <div className="mb-2">
                  <label className="sr-only" htmlFor="demo-uni-select">Select university</label>
                  <select
                    id="demo-uni-select"
                    value={selectedDemoUni}
                    onChange={(e) => handleSelectUniGroup(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs font-medium text-neutral-800 focus:outline-none focus:border-[#162A22] cursor-pointer"
                  >
                    {UNIVERSITY_DEMOS.map((uni) => (
                      <option key={uni.tenantId} value={uni.tenantId}>
                        {uni.universityName} ({uni.location})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {activeUniGroup.accounts.map((acc) => {
                    const isSelected = email === acc.email && tenantId === activeUniGroup.tenantId;
                    return (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => handleSelectDemoAccount(acc, activeUniGroup.tenantId)}
                        className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer border text-center ${
                          isSelected
                            ? 'bg-[#162A22] text-white border-[#162A22] shadow-xs'
                            : 'bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-200'
                        }`}
                      >
                        {acc.roleLabel.replace(' Admin', '').replace('Transit ', '').replace(' Rider', '')}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {isSignUp && (
                <>
                  <div className="space-y-1 text-left">
                    <label className="block text-xs font-semibold text-neutral-800 tracking-wide" htmlFor="signup-name">
                      Full name
                    </label>
                    <input
                      id="signup-name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#162A22] focus:ring-1 focus:ring-[#162A22] transition-all"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="block text-xs font-semibold text-neutral-800 tracking-wide" htmlFor="signup-workspace">
                      University workspace
                    </label>
                    <select
                      id="signup-workspace"
                      value={tenantId}
                      onChange={(e) => setTenantId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:outline-none focus:border-[#162A22] focus:ring-1 focus:ring-[#162A22] transition-all cursor-pointer"
                    >
                      {tenants.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="block text-xs font-semibold text-neutral-800 tracking-wide" htmlFor="signup-role">
                      Assigned role
                    </label>
                    <select
                      id="signup-role"
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:outline-none focus:border-[#162A22] focus:ring-1 focus:ring-[#162A22] transition-all cursor-pointer"
                    >
                      <option value="OPERATOR_ADMIN">Operator Admin</option>
                      <option value="DRIVER">Transit Driver</option>
                      <option value="RIDER">Student Rider</option>
                    </select>
                  </div>
                </>
              )}

              {!isSignUp && (
                <div className="space-y-1 text-left">
                  <label className="block text-xs font-semibold text-neutral-800 tracking-wide" htmlFor="login-workspace">
                    Target workspace
                  </label>
                  <select
                    id="login-workspace"
                    value={tenantId}
                    onChange={(e) => setTenantId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:outline-none focus:border-[#162A22] focus:ring-1 focus:ring-[#162A22] transition-all cursor-pointer"
                  >
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1 text-left">
                <label className="block text-xs font-semibold text-neutral-800 tracking-wide" htmlFor="fleet-email">
                  Workspace email
                </label>
                <input
                  id="fleet-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  autoComplete="email"
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#162A22] focus:ring-1 focus:ring-[#162A22] transition-all"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="block text-xs font-semibold text-neutral-800 tracking-wide" htmlFor="fleet-password">
                  Password
                </label>
                <input
                  id="fleet-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:outline-none focus:border-[#162A22] focus:ring-1 focus:ring-[#162A22] transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#162A22] hover:bg-[#12221b] text-white text-[13px] font-semibold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? 'Processing...' : isSignUp ? 'Create account' : 'Sign in to workspace'}
                </button>
              </div>
            </form>
          </div>

          <footer className="text-center pt-2 pb-1">
            <p className="text-xs text-neutral-500">
              <span>{isSignUp ? 'Already have an account?' : "Don't have an account?"}</span>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMessage('');
                }}
                className="text-[#162A22] font-semibold underline decoration-[#162A22] underline-offset-2 ml-1 hover:text-black transition-colors cursor-pointer"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </footer>
        </section>

        <section className="w-full md:w-1/2 h-[420px] md:h-full relative overflow-hidden bg-neutral-950 flex flex-col justify-end">
          <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
            {CAROUSEL_SLIDES.map((slide, idx) => (
              <article
                key={slide.author}
                className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                  idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
                }`}
              >
                <img
                  src={slide.image}
                  alt={slide.author}
                  className="w-full h-full object-cover object-center brightness-[0.78] contrast-[1.08] filter grayscale-[30%]"
                />
              </article>
            ))}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none z-10 opacity-90" />

          <div className="absolute top-6 right-6 z-20 flex items-center space-x-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
            {CAROUSEL_SLIDES.map((_, idx) => (
              <span
                key={idx}
                className={`rounded-full transition-all duration-300 ${
                  idx === currentSlide ? 'w-2.5 h-2.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>

          <div className="relative z-20 px-8 pb-8 pt-4 text-white flex flex-col justify-end">
            <blockquote className="mb-6 max-w-[480px] mx-auto text-center md:text-left">
              <p className="text-base sm:text-lg lg:text-[19px] font-normal leading-snug text-neutral-100 tracking-tight drop-shadow-sm min-h-[64px]">
                {activeQuote.quote}
              </p>
            </blockquote>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                aria-label="Previous quote"
                onClick={() =>
                  setCurrentSlide((prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length)
                }
                className="p-2.5 rounded-full hover:bg-white/20 active:bg-white/30 text-white/90 hover:text-white transition-all border border-white/20 hover:border-white/40 backdrop-blur-sm cursor-pointer"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <div className="flex items-center justify-center space-x-2 text-center">
                <svg className="w-6 h-10 text-white/80 shrink-0" fill="currentColor" viewBox="0 0 24 40">
                  <path d="M18 4C14 7 11 11 10 16C7 14 4 14 2 16C5 18 8 19 10 18C10 22 11 26 13 30C10 29 7 30 5 33C8 34 11 34 13 31C15 35 18 38 22 40C20 37 18 33 16 29C19 29 22 28 23 25C20 25 17 26 15 28C14 24 13 20 13 16C16 17 19 16 21 13C18 13 15 14 13 15C13 10 15 6 18 4Z" />
                </svg>

                <div className="px-1 text-center">
                  <p className="text-xs sm:text-[13px] font-semibold tracking-wide text-neutral-100">
                    {activeQuote.author} <span className="text-white/60 mx-1">/</span> {activeQuote.role}
                  </p>
                  <p className="text-[11px] text-white/70 font-medium">{activeQuote.org}</p>
                </div>

                <svg className="w-6 h-10 text-white/80 shrink-0 transform -scale-x-100" fill="currentColor" viewBox="0 0 24 40">
                  <path d="M18 4C14 7 11 11 10 16C7 14 4 14 2 16C5 18 8 19 10 18C10 22 11 26 13 30C10 29 7 30 5 33C8 34 11 34 13 31C15 35 18 38 22 40C20 37 18 33 16 29C19 29 22 28 23 25C20 25 17 26 15 28C14 24 13 20 13 16C16 17 19 16 21 13C18 13 15 14 13 15C13 10 15 6 18 4Z" />
                </svg>
              </div>

              <button
                type="button"
                aria-label="Next quote"
                onClick={() => setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length)}
                className="p-2.5 rounded-full hover:bg-white/20 active:bg-white/30 text-white/90 hover:text-white transition-all border border-white/20 hover:border-white/40 backdrop-blur-sm cursor-pointer"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
