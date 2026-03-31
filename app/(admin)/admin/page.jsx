'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  TrendingUp,
  Heart,
  Zap,
  BarChart3,
  ArrowRight,
  AlertCircle,
  DollarSign,
  Trophy,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check auth
        const authRes = await fetch('/api/auth/me');
        if (!authRes.ok) {
          router.push('/login');
          return;
        }

        const authData = await authRes.json();
        if (authData.data.user?.role !== 'admin') {
          router.push('/dashboard');
          return;
        }

        // Fetch analytics
        const analyticsRes = await fetch('/api/admin/analytics');
        if (analyticsRes.ok) {
          const data = await analyticsRes.json();
          setAnalytics(data.data);
        } else {
          setError('Failed to load analytics');
        }
      } catch (err) {
        console.error('Error fetching admin data:', err);
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 h-10 w-40 animate-pulse rounded-lg bg-gray-300"></div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-lg bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg px-4 py-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold text-brand-green">Admin Dashboard</h1>
            <p className="text-brand-text-muted">Platform overview and analytics</p>
          </div>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              router.push('/');
              router.refresh();
            }}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="mb-8 flex gap-3 rounded-lg bg-red-50 p-4 ring-1 ring-red-200">
            <AlertCircle size={16} className="flex-shrink-0 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
          {/* Total Users */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-brand-text-muted">Total Users</h3>
              <Users className="text-brand-gold" size={20} />
            </div>
            <p className="text-3xl font-bold text-brand-green">{analytics?.totalUsers || 0}</p>
            <p className="mt-2 text-xs text-brand-text-muted">Registered accounts</p>
          </div>

          {/* Active Subscriptions */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-brand-text-muted">Active Subscriptions</h3>
              <TrendingUp className="text-brand-green" size={20} />
            </div>
            <p className="text-3xl font-bold text-brand-green">{analytics?.subscriptions?.totalActiveSubscribers || 0}</p>
            <p className="mt-2 text-xs text-brand-text-muted">
              {analytics?.totalUsers
                ? `${((analytics.subscriptions?.totalActiveSubscribers / analytics.totalUsers) * 100).toFixed(1)}% conversion`
                : 'No data'}
            </p>
          </div>

          {/* Total Donations */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-brand-text-muted">Total Donations</h3>
              <Heart className="text-brand-gold" size={20} />
            </div>
            <p className="text-3xl font-bold text-brand-green">
              ${(analytics?.donations?.totalAmount || 0).toFixed(2)}
            </p>
            <p className="mt-2 text-xs text-brand-text-muted">Across all charities</p>
          </div>

          {/* Monthly Revenue */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-brand-text-muted">Monthly Revenue</h3>
              <DollarSign className="text-brand-gold" size={20} />
            </div>
            <p className="text-3xl font-bold text-brand-green">
              ${(analytics?.subscriptions?.monthlyRevenue || 0).toFixed(2)}
            </p>
            <p className="mt-2 text-xs text-brand-text-muted">This month</p>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid gap-6 lg:grid-cols-3 mb-12">
          {/* Registered Charities */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-2 font-semibold text-brand-green">Registered Charities</h3>
            <p className="text-3xl font-bold text-brand-gold">{analytics?.charities?.totalCharities || 0}</p>
            <p className="mt-3 text-xs text-brand-text-muted">Organizations on platform</p>
          </div>

          {/* Monthly Draws */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-2 font-semibold text-brand-green">Monthly Draws</h3>
            <p className="text-3xl font-bold text-brand-gold">{analytics?.draws?.published || 0}</p>
            <p className="mt-3 text-xs text-brand-text-muted">Draws published</p>
          </div>
        </div>

        {/* Management Sections */}
        <div className="grid gap-6 lg:grid-cols-2 mb-12">
          {/* Users Management */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-brand-green">
              <Users size={20} /> User Management
            </h3>
            <p className="mb-6 text-sm text-brand-text-muted">
              View, edit, and manage user accounts and subscriptions
            </p>
            <Link
              href="/admin/users"
              className="flex items-center justify-between rounded-lg border border-brand-gold text-brand-gold px-4 py-3 font-semibold transition-colors hover:bg-brand-gold/10"
            >
              Manage Users <ArrowRight size={16} />
            </Link>
          </div>

          {/* Draws Management */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-brand-green">
              <Zap size={20} /> Draw Management
            </h3>
            <p className="mb-6 text-sm text-brand-text-muted">
              Create, simulate, publish and manage monthly draws
            </p>
            <Link
              href="/admin/draws"
              className="flex items-center justify-between rounded-lg border border-brand-gold text-brand-gold px-4 py-3 font-semibold transition-colors hover:bg-brand-gold/10"
            >
              Manage Draws <ArrowRight size={16} />
            </Link>
          </div>

          {/* Charities Management */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-brand-green">
              <Heart size={20} /> Charity Management
            </h3>
            <p className="mb-6 text-sm text-brand-text-muted">
              Add, edit, and manage registered charities
            </p>
            <Link
              href="/admin/charities"
              className="flex items-center justify-between rounded-lg border border-brand-gold text-brand-gold px-4 py-3 font-semibold transition-colors hover:bg-brand-gold/10"
            >
              Manage Charities <ArrowRight size={16} />
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-brand-green">
              <BarChart3 size={20} /> Quick Stats
            </h3>
            <div className="space-y-3">
              {analytics?.golfScores?.totalScores !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-brand-text-muted">Total scores logged</span>
                  <span className="font-semibold text-brand-green">{analytics.golfScores.totalScores}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="rounded-xl border border-gray-200 bg-brand-bg p-6">
          <div className="flex gap-4">
            <AlertCircle size={20} className="flex-shrink-0 text-brand-green" />
            <div>
              <h3 className="font-semibold text-brand-green">Admin Panel</h3>
              <p className="mt-2 text-sm text-brand-text">
                Monitor platform health, manage users and charities, and oversee monthly draws. All changes are logged for audit purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
