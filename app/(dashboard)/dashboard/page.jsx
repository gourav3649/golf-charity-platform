'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  TrendingUp,
  Heart,
  Trophy,
  Zap,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [scores, setScores] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user profile with scores
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) {
          router.push('/login');
          return;
        }

        const userData = await userRes.json();
        setUser(userData.data.user);
        setScores(userData.data.scores || []);

        // Fetch subscription status
        const subRes = await fetch('/api/subscriptions/status');
        if (subRes.ok) {
          const subData = await subRes.json();
          setSubscription(subData.data);
        }

        // Fetch winnings data
        const drawRes = await fetch('/api/draws/results?month=' + new Date().toISOString().slice(0, 7));
        if (drawRes.ok) {
          const drawData = await drawRes.json();
          // Find if current user is a winner
          const userId = userData.data.user._id;
          const winners = drawData.data?.winners || [];
          const userWinnings = winners.filter(w => w.userId === userId);
          const totalWon = userWinnings.reduce((sum, w) => sum + (w.prizeAmount || 0), 0);
          const paidOut = userWinnings.filter(w => w.verificationStatus === 'paid').reduce((sum, w) => sum + (w.prizeAmount || 0), 0);
          setStats({
            totalWon,
            pendingVerification: userWinnings.filter(w => w.verificationStatus === 'approved').length,
            paidOut,
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 h-10 w-32 animate-pulse rounded-lg bg-slate-800"></div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-lg bg-slate-800"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 px-4 py-12">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold text-white">
              Welcome back, {user?.firstName}! 👋
            </h1>
            <p className="text-slate-400">Track your progress and manage your subscriptions</p>
          </div>
          <div className="flex gap-3">
            {user?.role === 'admin' && (
              <Link
                href="/admin"
                className="rounded-lg bg-blue-600/20 px-4 py-2 text-sm font-semibold text-blue-300 transition-colors hover:bg-blue-600/30"
              >
                Admin Panel
              </Link>
            )}
            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                router.push('/');
                router.refresh();
              }}
              className="rounded-lg bg-red-600/20 px-4 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-red-600/30"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 1. Subscription Status Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 lg:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-white">Subscription</h2>
              <CreditCard className="text-blue-400" size={20} />
            </div>

            {subscription?.status === 'active' ? (
              <>
                <div className="mb-4">
                  <p className="text-sm text-slate-400">Current Plan</p>
                  <p className="text-2xl font-bold text-white capitalize">
                    {subscription?.plan || 'Monthly'}
                  </p>
                </div>

                <div className="mb-6 rounded-lg bg-slate-800/50 p-4">
                  <p className="mb-1 text-xs text-slate-400">Amount per month</p>
                  <p className="text-lg font-bold text-green-400">
                    {subscription?.plan === 'yearly' ? '$7.99/mo' : '$9.99/mo'}
                  </p>
                </div>

                <div className="mb-6 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-500" />
                  <span className="text-sm text-green-300">Active</span>
                </div>

                {subscription?.daysUntilRenewal && (
                  <p className="mb-4 text-xs text-slate-400">
                    Renews in {subscription.daysUntilRenewal} days
                  </p>
                )}

                <div className="flex flex-col gap-2">
                  <Link
                    href="/subscriptions"
                    className="rounded-lg bg-slate-800 px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-slate-700"
                  >
                    Manage Plan
                  </Link>
                  <button
                    onClick={async () => {
                      await fetch('/api/subscriptions/cancel', {
                        method: 'POST',
                      });
                      router.refresh();
                    }}
                    className="rounded-lg bg-red-600/20 px-4 py-2 text-center text-sm font-semibold text-red-300 transition-colors hover:bg-red-600/30"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mb-6 text-sm text-slate-400">
                  You don't have an active subscription yet.
                </p>
                <Link
                  href="/subscriptions"
                  className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 font-semibold text-white transition-all hover:shadow-lg hover:shadow-blue-500/25"
                >
                  Subscribe Now <ArrowRight size={16} />
                </Link>
              </>
            )}
          </div>

          {/* 2. Golf Scores Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 lg:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-white">Golf Scores</h2>
              <TrendingUp className="text-cyan-400" size={20} />
            </div>

            {scores.length > 0 ? (
              <>
                <div className="mb-6 space-y-2">
                  <div className="rounded-lg bg-slate-800/50 p-4">
                    <p className="text-xs text-slate-400">Average Score</p>
                    <p className="text-3xl font-bold text-cyan-400">
                      {(scores.reduce((sum, s) => sum + s.value, 0) / scores.length).toFixed(1)}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400">
                    {scores.length} score{scores.length !== 1 ? 's' : ''} logged
                  </p>
                </div>

                <div className="mb-6 space-y-2">
                  {scores.slice(0, 3).map((score, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg bg-slate-800/30 p-3"
                    >
                      <div>
                        <p className="font-semibold text-white">{score.value}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(score.date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="rounded bg-cyan-600/20 px-2 py-1 text-xs font-semibold text-cyan-300">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/scores"
                  className="flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
                >
                  View & Log Scores
                </Link>
              </>
            ) : (
              <>
                <p className="mb-6 text-sm text-slate-400">No scores logged yet.</p>
                <Link
                  href="/scores"
                  className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 font-semibold text-white transition-all hover:shadow-lg hover:shadow-blue-500/25"
                >
                  <Plus size={16} /> Log Your First Score
                </Link>
              </>
            )}
          </div>

          {/* 3. Charity Selection Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 lg:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-white">Your Charity</h2>
              <Heart className="text-red-400" size={20} />
            </div>

            {user?.selectedCharityId ? (
              <>
                <div className="mb-6">
                  <p className="mb-1 text-sm text-slate-400">Selected Charity</p>
                  <p className="mb-3 text-lg font-bold text-white">
                    {user.selectedCharityId.name}
                  </p>
                  <p className="mb-4 text-sm text-slate-400">
                    {user.selectedCharityId.category}
                  </p>
                </div>

                <div className="mb-6 rounded-lg bg-slate-800/50 p-4">
                  <p className="text-xs text-slate-400">Contribution Rate</p>
                  <p className="text-2xl font-bold text-red-400">
                    {user.charityContributionPercent || 100}%
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Of your subscription goes to this charity
                  </p>
                </div>

                <Link
                  href="/subscriptions"
                  className="rounded-lg bg-slate-800 px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-slate-700"
                >
                  Change Charity
                </Link>
              </>
            ) : (
              <>
                <p className="mb-6 text-sm text-slate-400">
                  No charity selected yet. Choose one to start making impact!
                </p>
                <Link
                  href="/subscriptions"
                  className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-pink-600 px-4 py-2 font-semibold text-white transition-all hover:shadow-lg hover:shadow-red-500/25"
                >
                  Select a Charity
                </Link>
              </>
            )}
          </div>

          {/* 4. Draw Participation Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 lg:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-white">This Month's Draw</h2>
              <Zap className="text-yellow-400" size={20} />
            </div>

            {subscription?.status === 'active' ? (
              <>
                <div className="mb-6">
                  <p className="mb-2 text-sm text-slate-400">You're eligible to win with:</p>
                  <p className="text-2xl font-bold text-white">{scores.length} scores</p>
                </div>

                {scores.length >= 3 ? (
                  <div className="mb-6 flex items-center gap-2 rounded-lg bg-green-600/10 p-4 ring-1 ring-green-600/20">
                    <CheckCircle2 size={16} className="text-green-400" />
                    <span className="text-sm text-green-300">Ready to enter draw</span>
                  </div>
                ) : (
                  <div className="mb-6 flex items-center gap-2 rounded-lg bg-yellow-600/10 p-4 ring-1 ring-yellow-600/20">
                    <Clock size={16} className="text-yellow-400" />
                    <span className="text-sm text-yellow-300">
                      Need {3 - scores.length} more scores
                    </span>
                  </div>
                )}

                <p className="text-xs text-slate-400">
                  Draws run monthly. Winners are drawn on the last day of each month.
                </p>
              </>
            ) : (
              <>
                <p className="mb-6 text-sm text-slate-400">
                  Subscribe to participate in monthly draws and win prizes!
                </p>
                <Link
                  href="/subscriptions"
                  className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-yellow-600 to-orange-600 px-4 py-2 font-semibold text-white transition-all hover:shadow-lg hover:shadow-yellow-500/25"
                >
                  Start Participating
                </Link>
              </>
            )}
          </div>

          {/* 5. Winnings Overview Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 lg:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-white">Winnings</h2>
              <Trophy className="text-yellow-400" size={20} />
            </div>

            <div className="mb-6 space-y-3">
              <div className="rounded-lg bg-slate-800/50 p-4">
                <p className="text-xs text-slate-400">Total Won</p>
                <p className="text-3xl font-bold text-yellow-400">${(stats?.totalWon || 0).toFixed(2)}</p>
              </div>

              <div className="rounded-lg bg-slate-800/50 p-4">
                <p className="text-xs text-slate-400">Pending Verification</p>
                <p className="text-xl font-bold text-white">{stats?.pendingVerification || 0}</p>
              </div>

              <div className="rounded-lg bg-slate-800/50 p-4">
                <p className="text-xs text-slate-400">Paid Out</p>
                <p className="text-xl font-bold text-green-400">${(stats?.paidOut || 0).toFixed(2)}</p>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Win real prizes in monthly draws by matching your scores to drawn numbers.
            </p>
          </div>

          {/* 6. Quick Actions Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 lg:col-span-1">
            <h2 className="mb-4 font-bold text-white">Quick Actions</h2>

            <div className="space-y-3">
              <Link
                href="/scores"
                className="flex items-center justify-between rounded-lg bg-slate-800/50 p-4 transition-colors hover:bg-slate-800"
              >
                <span className="font-medium text-white">Log Score</span>
                <Plus size={16} className="text-slate-400" />
              </Link>

              <Link
                href="/subscriptions"
                className="flex items-center justify-between rounded-lg bg-slate-800/50 p-4 transition-colors hover:bg-slate-800"
              >
                <span className="font-medium text-white">Manage Subscription</span>
                <CreditCard size={16} className="text-slate-400" />
              </Link>

              <Link
                href="/subscriptions"
                className="flex items-center justify-between rounded-lg bg-slate-800/50 p-4 transition-colors hover:bg-slate-800"
              >
                <span className="font-medium text-white">Select Charity</span>
                <Heart size={16} className="text-slate-400" />
              </Link>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-12 rounded-xl border border-slate-700 bg-slate-800/30 p-6">
          <div className="flex gap-4">
            <AlertCircle size={20} className="flex-shrink-0 text-blue-400" />
            <div>
              <h3 className="font-semibold text-white">How this works</h3>
              <p className="mt-2 text-sm text-slate-300">
                Subscribe to participate in monthly draws. Log your golf scores to increase your winning chances. We draw 5 numbers monthly — match yours to win prizes. Your contribution supports the charity you selected.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
