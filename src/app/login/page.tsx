'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Lock, User, ShieldCheck, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAppStore();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter your username/email and password.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    const result = await login(username, password);
    setIsSubmitting(false);

    if (result.success) {
      toast({ title: 'Welcome back!', description: 'Authenticated successfully.' });
      router.push('/dashboard');
    } else {
      toast({
        title: 'Access Denied',
        description: result.error || 'Invalid username or password.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col"
        style={{ background: 'linear-gradient(135deg, #3d1c02 0%, #6b3410 30%, #a8540f 60%, #c8762e 85%, #e8a44a 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }} />
        <div className="absolute -bottom-32 -right-16 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-5"
          style={{ border: '1px solid #fff' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-5"
          style={{ border: '1px solid #fff' }} />

        {/* Floating decorative */}
        <div className="absolute top-16 right-16 text-white/20 text-8xl font-black select-none">✦</div>
        <div className="absolute bottom-20 left-12 text-white/15 text-6xl font-black select-none">✦</div>

        {/* Watermark logo in background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.07] pointer-events-none">
          <Image src="/logo.png" alt="" width={420} height={420} className="object-contain" style={{ filter: 'brightness(10)' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-12 py-10">
          {/* Top brand bar */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Image src="/logo.png" alt="CinnamonLanka" width={36} height={36} className="object-contain" />
            </div>
            <div>
              <p className="text-white/60 text-[10px] uppercase tracking-widest font-bold">Premium Ceylon</p>
              <p className="text-white font-black text-sm tracking-wide">CinnamonLanka</p>
            </div>
          </div>

          {/* Center hero */}
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-44 h-44 bg-white/10 rounded-full flex items-center justify-center mb-8 backdrop-blur-sm border-2 border-white/25 shadow-2xl">
              <Image
                src="/logo.png"
                alt="Cinnamon Lanka Exports"
                width={140}
                height={140}
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>

            <h1 className="text-white font-black text-4xl leading-tight mb-2 tracking-tight">CinnamonLanka</h1>
            <h2 className="font-black text-2xl mb-4 tracking-wider" style={{ color: '#f5c87a' }}>CRM</h2>
            <p className="text-white/70 text-sm max-w-xs leading-relaxed mb-8">
              The world&apos;s finest Ceylon cinnamon, exported with care. Manage your business seamlessly.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 justify-center">
              {['Staff Management', 'Invoice Tracking', 'Customer CRM', 'Internal Analytics'].map((f) => (
                <span key={f}
                  className="px-3 py-1 rounded-full text-[11px] font-bold text-white/80 border border-white/20"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                >{f}</span>
              ))}
            </div>
          </div>

          {/* Bottom security badge */}
          <div className="flex items-center gap-2 text-white/50 text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>Enterprise-grade security • Role-based access control</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-[45%] flex flex-col items-center justify-center bg-white relative overflow-hidden px-8 py-12">
        {/* Subtle bg accents */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-[0.04] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #a8540f 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-[0.04] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #a8540f 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

        <div className="w-full max-w-sm relative z-10">
          {/* Mobile-only logo */}
          <div className="flex lg:hidden flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-3xl overflow-hidden flex items-center justify-center bg-amber-50 border border-amber-100 mb-3">
              <Image src="/logo.png" alt="CinnamonLanka" width={72} height={72} className="object-contain" />
            </div>
            <h1 className="text-2xl font-black text-gray-800">CinnamonLanka CRM</h1>
          </div>

          {/* Greeting */}
          <div className="mb-8">
            <h2 className="text-4xl font-black text-gray-800 mb-1">Welcome</h2>
            <p className="text-gray-400 text-sm font-medium">Sign in to your staff account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-100 rounded-2xl text-sm text-gray-700 placeholder-gray-300 bg-gray-50/50 outline-none transition-all duration-200 focus:bg-white"
                  style={{ focusBorderColor: '#a8540f' } as React.CSSProperties}
                  onFocus={e => { e.currentTarget.style.borderColor = '#a8540f'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#f3f4f6'; }}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••••••"
                  className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-100 rounded-2xl text-sm text-gray-700 placeholder-gray-300 bg-gray-50/50 outline-none transition-all duration-200 focus:bg-white"
                  onFocus={e => { e.currentTarget.style.borderColor = '#a8540f'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#f3f4f6'; }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl text-white font-bold text-sm tracking-wider transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
              style={{
                background: 'linear-gradient(135deg, #6b3410 0%, #a8540f 50%, #c8762e 100%)',
                boxShadow: '0 8px 25px rgba(168,84,15,0.35)',
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                'SIGN IN'
              )}
            </button>
          </form>

          {/* Info notice */}
          <div className="mt-8 p-4 rounded-2xl bg-amber-50 border border-amber-100">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Access is managed exclusively by the Super Administrator. Contact your system admin for account credentials.
              </p>
            </div>
          </div>

          <p className="text-center text-[10px] text-gray-300 font-medium mt-6">
            CinnamonLanka CRM • Secure Enterprise Portal
          </p>
        </div>
      </div>
    </div>
  );
}
