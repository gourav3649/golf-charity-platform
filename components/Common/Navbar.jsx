'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, LogOut, BarChart3 } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in by checking for auth token
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setIsLoggedIn(true);
          setUser(data.data.user);
        }
      } catch (error) {
        setIsLoggedIn(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsLoggedIn(false);
    setUser(null);
    router.push('/');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/75">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-poppins text-xl font-bold text-white transition-opacity hover:opacity-80"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <span className="text-sm font-bold">GC</span>
            </div>
            <span className="hidden sm:inline">Golf Charity</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="/"
              className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
            >
              Home
            </Link>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
            >
              How It Works
            </a>
            <a
              href="#charities"
              className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
            >
              Charities
            </a>
          </div>

          {/* Auth Links */}
          <div className="flex items-center gap-4">
            {isLoggedIn && user ? (
              <>
                <Link
                  href="/dashboard"
                  className="hidden items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 md:flex"
                >
                  <BarChart3 size={16} />
                  Dashboard
                </Link>
                {user?.role === 'admin' && (
                  <Link href="/admin" className="hidden items-center gap-2 rounded-lg bg-blue-600/20 px-4 py-2 text-sm font-medium text-blue-300 transition-colors hover:bg-blue-600/30 md:flex">
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-lg bg-red-600/20 px-4 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-600/30"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white sm:block"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 text-sm font-bold text-white transition-all hover:shadow-lg hover:shadow-blue-500/25"
                >
                  Get Started
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white md:hidden"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="animate-in fade-in slide-in-from-top-2 border-t border-slate-800 bg-slate-900/50 py-4 backdrop-blur md:hidden">
            <div className="flex flex-col gap-3">
              <Link
                href="/"
                className="rounded px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <a
                href="#how-it-works"
                className="rounded px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                How It Works
              </a>
              <a
                href="#charities"
                className="rounded px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                Charities
              </a>
              {isLoggedIn && user && (
                <>
                  <Link
                    href="/dashboard"
                    className="rounded px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                    onClick={() => setIsOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="rounded px-4 py-2 text-left text-sm text-red-300 transition-colors hover:bg-red-600/20"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
