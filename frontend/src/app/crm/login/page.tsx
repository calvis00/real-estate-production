'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/utils/api';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await res.json();

      if (res.ok) {
        if (typeof window !== 'undefined' && data?.csrfToken) {
          window.localStorage.setItem('crmCsrfToken', data.csrfToken);
        }
        router.push('/crm/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Could not connect to the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 bg-gradient-to-br from-background via-surface to-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-12 animate-slow-fade">
          <h1 className="text-4xl font-extrabold font-headline text-primary tracking-tighter mb-2">
            ADMIN <span className="text-secondary">PORTAL</span>
          </h1>
          <p className="text-outline text-xs font-bold uppercase tracking-widest">Premium Nature-Integrated Real Estate</p>
        </div>

        <div className="bg-surface p-8 md:p-10 rounded-3xl shadow-xl border border-surface-container relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary opacity-20" />
          
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center text-red-600 text-sm font-medium">
                <span className="material-symbols-outlined mr-2 shrink-0">error</span>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-outline ml-1">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40">mail</span>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@estate.com" 
                  required
                  className="w-full bg-surface border border-surface-container rounded-xl py-3.5 pl-12 pr-4 focus:border-primary outline-none transition text-on-surface placeholder-outline/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-outline ml-1">Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40">lock</span>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  required
                  className="w-full bg-surface border border-surface-container rounded-xl py-3.5 pl-12 pr-4 focus:border-primary outline-none transition text-on-surface placeholder-outline/30"
                />
              </div>
            </div>

            <button 
              disabled={loading}
              type="submit"
              className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-opacity-95 transition flex items-center justify-center disabled:opacity-50 shadow-lg active:scale-95 gap-2"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">key</span>
                  Secure Login
                </>
              )}
            </button>
          </form>
        </div>
        
        <div className="text-center mt-8">
          <button 
            onClick={() => router.push('/')}
            className="text-[10px] font-bold uppercase tracking-widest text-outline hover:text-primary transition-colors flex items-center gap-2 mx-auto"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
