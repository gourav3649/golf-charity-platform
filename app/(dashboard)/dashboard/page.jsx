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
      <div className="min-h-screen bg-brand-bg px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 h-10 w-32 animate-pulse rounded-lg bg-gray-300"></div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-lg bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg px-4 py-12">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold text-brand-green">
              Welcome back, {user?.firstName}! 👋
            </h1>
            <p className="text-brand-text-muted">Track your progress and manage your subscriptions</p>
          </div>
          <div className="flex gap-3">
            {user?.role === 'admin' && (
              <Link
                href="/admin"
                className="rounded-lg border border-brand-green text-brand-green px-4 py-2 text-sm font-semibold transition-colors hover:bg-brand-green/10"
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
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 1. Subscription Status Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-brand-green">Subscription</h2>
              <CreditCard className="text-brand-gold" size={20} />
            </div>

            {subscription?.subscription?.status === 'active' ? (
              <>
                <div className="mb-4">
                  <p className="text-sm text-brand-text-muted">Current Plan</p>
                  <p className="text-2xl font-bold text-brand-green capitalize">
                    {subscription?.plan || 'Monthly'}
                  </p>
                </div>

                <div className="mb-6 rounded-lg bg-brand-bg p-4">
                  <p className="mb-1 text-xs text-brand-text-muted">Amount per month</p>
                  <p className="text-lg font-bold text-brand-gold">
                    {subscription?.plan === 'yearly' ? '$7.99/mo' : '$9.99/mo'}
                  </p>
                </div>

                <div className="mb-6 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-brand-green" />
                  <span className="text-sm text-brand-green">Active</span>
                </div>

                {subscription?.daysUntilRenewal && (
                  <p className="mb-4 text-xs text-brand-text-muted">
                    Renews in {subscription.daysUntilRenewal} days
                  </p>
                )}

                <div className="flex flex-col gap-2">
                  <Link
                    href="/subscriptions"
                    className="rounded-lg border border-brand-green text-brand-green px-4 py-2 text-center text-sm font-semibold transition-colors hover:bg-brand-green/10"
                  >
                    Manage Plan
                  </Link>
                  <button
                    onClick={async () => {
                      if (!confirm('Are you sure you want to cancel your subscription?')) return;
                      await fetch('/api/subscriptions/cancel', {
                        method: 'POST',
                      });
                      window.location.reload();
                    }}
                    className="rounded-lg bg-red-600 px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-red-700"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mb-6 text-sm text-brand-text-muted">
                  You don't have an active subscription yet.
                </p>
                <Link
                  href="/subscriptions"
                  className="flex items-center justify-center gap-2 rounded-lg bg-brand-gold px-4 py-2 font-semibold text-white transition-all hover:bg-brand-gold/90"
                >
                  Subscribe Now <ArrowRight size={16} />
                </Link>
              </>
            )}
          </div>

          {/* 2. Golf Scores Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-brand-green">Golf Scores</h2>
              <TrendingUp className="text-brand-gold" size={20} />
            </div>

            {scores.length > 0 ? (
              <>
                <div className="mb-6 space-y-2">
                  <div className="rounded-lg bg-brand-bg p-4">
                    <p className="text-xs text-brand-text-muted">Average Score</p>
                    <p className="text-3xl font-bold text-brand-gold">
                      {(scores.reduce((sum, s) => sum + s.value, 0) / scores.length).toFixed(1)}
                    </p>
                  </div>
                  <p className="text-xs text-brand-text-muted">
                    {scores.length} score{scores.length !== 1 ? 's' : ''} logged
                  </p>
                </div>

                <div className="mb-6 space-y-2">
                  {scores.slice(0, 3).map((score, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                    >
                      <div>
                        <p className="font-semibold text-brand-green">{score.value}</p>
                        <p className="text-xs text-brand-text-muted">
                          {new Date(score.date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="rounded bg-brand-gold/20 px-2 py-1 text-xs font-semibold text-brand-gold">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/scores"
                  className="flex items-center justify-center gap-2 rounded-lg border border-brand-green text-brand-green px-4 py-2 text-sm font-semibold transition-colors hover:bg-brand-green/10"
                >
                  View & Log Scores
                </Link>
              </>
            ) : (
              <>
                <p className="mb-6 text-sm text-brand-text-muted">No scores logged yet.</p>
                <Link
                  href="/scores"
                  className="flex items-center justify-center gap-2 rounded-lg bg-brand-gold px-4 py-2 font-semibold text-white transition-all hover:bg-brand-gold/90"
                >
                  <Plus size={16} /> Log Your First Score
                </Link>
              </>
            )}
          </div>

          {/* 3. Charity Selection Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-brand-green">Your Charity</h2>
              <Heart className="text-brand-gold" size={20} />
            </div>

            {user?.selectedCharityId ? (
              <>
                <div className="mb-6">
                  <p className="mb-1 text-sm text-brand-text-muted">Selected Charity</p>
                  <p className="mb-3 text-lg font-bold text-brand-green">
                    {user.selectedCharityId.name}
                  </p>
                  <p className="mb-4 text-sm text-brand-text-muted">
                    {user.selectedCharityId.category}
                  </p>
                </div>

                <div className="mb-6 rounded-lg bg-brand-bg p-4">
                  <p className="text-xs text-brand-text-muted">Contribution Rate</p>
                  <p className="text-2xl font-bold text-brand-green">
                    {user.charityContributionPercent || 100}%
                  </p>
                  <p className="mt-2 text-xs text-brand-text-muted">
                    Of your subscription goes to this charity
                  </p>
                </div>

                <Link
                  href="/subscriptions?step=charity"
                  className="rounded-lg border border-brand-green text-brand-green px-4 py-2 text-center text-sm font-semibold transition-colors hover:bg-brand-green/10"
                >
                  Change Charity
                </Link>
              </>
            ) : (
              <>
                <p className="mb-6 text-sm text-brand-text-muted">
                  No charity selected yet. Choose one to start making impact!
                </p>
                <Link
                  href="/subscriptions?step=charity"
                  className="flex items-center justify-center gap-2 rounded-lg bg-brand-gold px-4 py-2 font-semibold text-white transition-all hover:bg-brand-gold/90"
                >
                  Select a Charity
                </Link>
              </>
            )}
          </div>

          {/* 4. Draw Participation Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-brand-green">This Month's Draw</h2>
              <Zap className="text-brand-gold" size={20} />
            </div>

            {subscription?.subscription?.status === 'active' ? (
              <>
                <div className="mb-6">
                  <p className="mb-2 text-sm text-brand-text-muted">You're eligible to win with:</p>
                  <p className="text-2xl font-bold text-brand-green">{scores.length} scores</p>
                </div>

                {scores.length >= 3 ? (
                  <div className="mb-6 flex items-center gap-2 rounded-lg bg-brand-green/10 p-4 ring-1 ring-brand-green/20">
                    <CheckCircle2 size={16} className="text-brand-green" />
                    <span className="text-sm text-brand-green">Ready to enter draw</span>
                  </div>
                ) : (
                  <div className="mb-6 flex items-center gap-2 rounded-lg bg-brand-gold/10 p-4 ring-1 ring-brand-gold/20">
                    <Clock size={16} className="text-brand-gold" />
                    <span className="text-sm text-brand-gold">
                      Need {3 - scores.length} more scores
                    </span>
                  </div>
                )}

                <p className="text-xs text-brand-text-muted">
                  Draws run monthly. Winners are drawn on the last day of each month.
                </p>
              </>
            ) : (
              <>
                <p className="mb-6 text-sm text-brand-text-muted">
                  Subscribe to participate in monthly draws and win prizes!
                </p>
                <Link
                  href="/subscriptions"
                  className="flex items-center justify-center gap-2 rounded-lg bg-brand-gold px-4 py-2 font-semibold text-white transition-all hover:bg-brand-gold/90"
                >
                  Start Participating
                </Link>
              </>
            )}
          </div>

          {/* 5. Winnings Overview Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-brand-green">Winnings</h2>
              <Trophy className="text-brand-gold" size={20} />
            </div>

            <div className="mb-6 space-y-3">
              <div className="rounded-lg bg-brand-bg p-4">
                <p className="text-xs text-brand-text-muted">Total Won</p>
                <p className="text-3xl font-bold text-brand-gold">${(stats?.totalWon || 0).toFixed(2)}</p>
              </div>

              <div className="rounded-lg bg-brand-bg p-4">
                <p className="text-xs text-brand-text-muted">Pending Verification</p>
                <p className="text-xl font-bold text-brand-green">{stats?.pendingVerification || 0}</p>
              </div>

              <div className="rounded-lg bg-brand-bg p-4">
                <p className="text-xs text-brand-text-muted">Paid Out</p>
                <p className="text-xl font-bold text-brand-green">${(stats?.paidOut || 0).toFixed(2)}</p>
              </div>
            </div>

            <p className="text-xs text-brand-text-muted">
              Win real prizes in monthly draws by matching your scores to drawn numbers.
            </p>
          </div>

          {/* 6. Quick Actions Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-1">
            <h2 className="mb-4 font-bold text-brand-green">Quick Actions</h2>

            <div className="space-y-3">
              <Link
                href="/scores"
                className="flex items-center justify-between rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100"
              >
                <span className="font-medium text-brand-green">Log Score</span>
                <Plus size={16} className="text-brand-text-muted" />
              </Link>

              <Link
                href="/subscriptions"
                className="flex items-center justify-between rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100"
              >
                <span className="font-medium text-brand-green">Manage Subscription</span>
                <CreditCard size={16} className="text-brand-text-muted" />
              </Link>

              <Link
                href="/subscriptions"
                className="flex items-center justify-between rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100"
              >
                <span className="font-medium text-brand-green">Select Charity</span>
                <Heart size={16} className="text-brand-text-muted" />
              </Link>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-12 rounded-xl border border-gray-200 bg-brand-bg p-6">
          <div className="flex gap-4">
            <AlertCircle size={20} className="flex-shrink-0 text-brand-green" />
            <div>
              <h3 className="font-semibold text-brand-green">How this works</h3>
              <p className="mt-2 text-sm text-brand-text">
                Subscribe to participate in monthly draws. Log your golf scores to increase your winning chances. We draw 5 numbers monthly — match yours to win prizes. Your contribution supports the charity you selected.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
