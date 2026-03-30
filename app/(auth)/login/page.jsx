'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Mail, Lock, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Login failed. Please check your credentials.');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
      {/* Background accents */}
      <div className="absolute -right-40 top-20 h-80 w-80 rounded-full bg-gradient-to-l from-blue-600/20 to-transparent blur-3xl"></div>
      <div className="absolute -left-40 bottom-20 h-80 w-80 rounded-full bg-gradient-to-r from-cyan-600/20 to-transparent blur-3xl"></div>

      <div className="relative flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-4xl font-bold text-white">Welcome Back</h1>
            <p className="text-slate-400">Log in to your account and continue your journey</p>
          </div>

          {/* Form Card */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur sm:p-10"
          >
            {/* Error Alert */}
            {error && (
              <div className="mb-6 flex gap-3 rounded-lg bg-red-600/10 p-4 ring-1 ring-red-600/20">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-white">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 py-3 pl-12 pr-4 text-white placeholder-slate-500 transition-all focus:border-blue-600 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="mb-8">
              <label className="mb-2 block text-sm font-semibold text-white">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 py-3 pl-12 pr-4 text-white placeholder-slate-500 transition-all focus:border-blue-600 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 py-3 font-bold text-white transition-all hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>

            {/* Divider */}
            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-700"></div>
              <p className="text-xs text-slate-500">OR</p>
              <div className="h-px flex-1 bg-slate-700"></div>
            </div>

            {/* Sign Up Link */}
            <p className="text-center text-sm text-slate-400">
              Don't have an account?{' '}
              <Link
                href="/signup"
                className="font-semibold text-blue-400 transition-colors hover:text-blue-300"
              >
                Sign up for free
              </Link>
            </p>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 rounded-lg border border-slate-800 bg-slate-900/30 p-4 text-center">
            <p className="text-xs text-slate-500">Demo Credentials (if testing):</p>
            <p className="mt-1 font-mono text-xs text-slate-400">
              Email: demo@example.com | Password: Demo123!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
