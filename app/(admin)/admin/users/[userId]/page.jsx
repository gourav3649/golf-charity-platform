'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  ChevronLeft,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Heart,
  TrendingUp,
  Calendar,
  Mail,
  Trophy,
} from 'lucide-react';

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingPercent, setEditingPercent] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
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

        // Fetch user details
        const userRes = await fetch(`/api/admin/users/${userId}`);
        if (userRes.ok) {
          const data = await userRes.json();
          setUser(data.data);
          setEditingPercent(data.data.charityContributionPercent);
        } else if (userRes.status === 404) {
          setError('User not found');
        } else {
          setError('Failed to load user');
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId, router]);

  const handleUpdateCharity = async () => {
    if (!user) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          charityContributionPercent: parseInt(editingPercent),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser({
          ...user,
          charityContributionPercent: parseInt(editingPercent),
        });
        setError('');
        alert('Charity contribution percentage updated successfully');
      } else {
        setError('Failed to update charity contribution');
      }
    } catch (err) {
      console.error('Error updating charity:', err);
      setError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteScore = async (scoreId) => {
    if (!window.confirm('Delete this score?')) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scoreToDelete: scoreId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser({
          ...user,
          golfScores: {
            ...user.golfScores,
            scores: user.golfScores.scores.filter(s => s._id !== scoreId && s.value),
            count: user.golfScores.count - 1,
          },
        });
      } else {
        setError('Failed to delete score');
      }
    } catch (err) {
      console.error('Error deleting score:', err);
      setError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!window.confirm('Are you absolutely sure? This will delete all user data permanently.')) {
      setDeleteConfirm(false);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        alert('User deleted successfully');
        router.push('/admin/users');
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('An error occurred while deleting user');
    } finally {
      setSubmitting(false);
      setDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 h-10 w-40 animate-pulse rounded-lg bg-gray-300"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-brand-bg px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/admin/users"
            className="mb-8 flex items-center gap-2 text-brand-green font-semibold hover:text-brand-green/80"
          >
            <ChevronLeft size={20} /> Back to Users
          </Link>
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
            <User size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-brand-text-muted">User not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg px-4 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/admin/users"
              className="mb-4 flex items-center gap-2 text-brand-green font-semibold hover:text-brand-green/80"
            >
              <ChevronLeft size={20} /> Back to Users
            </Link>
            <h1 className="text-4xl font-bold text-brand-green">{user.name}</h1>
            <p className="text-brand-text-muted">{user.email}</p>
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

        {/* User Info */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Account Info */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-brand-green">
              <User size={20} /> Account Information
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-brand-text-muted">Email</p>
                <p className="text-base font-semibold text-brand-text">{user.email}</p>
              </div>
              <div>
                <p className="text-xs text-brand-text-muted">Full Name</p>
                <p className="text-base font-semibold text-brand-text">{user.name}</p>
              </div>
              <div>
                <p className="text-xs text-brand-text-muted">Member Since</p>
                <p className="text-base font-semibold text-brand-text">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-brand-text-muted">Role</p>
                <p className="text-base font-semibold text-brand-text capitalize">{user.role}</p>
              </div>
            </div>
          </div>

          {/* Subscription Info */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-brand-green">
              <TrendingUp size={20} /> Subscription Details
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-brand-text-muted">Status</p>
                <div className="mt-1 flex items-center gap-2">
                  {user.subscription.status === 'active' ? (
                    <>
                      <CheckCircle2 size={16} className="text-brand-green" />
                      <span className="font-semibold text-brand-green capitalize">
                        {user.subscription.status}
                      </span>
                    </>
                  ) : (
                    <span className="font-semibold text-brand-text-muted capitalize">
                      {user.subscription.status}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-brand-text-muted">Plan</p>
                <p className="text-base font-semibold text-brand-text capitalize">
                  {user.subscription.plan || 'None'}
                </p>
              </div>
              <div>
                <p className="text-xs text-brand-text-muted">Monthly Amount</p>
                <p className="text-base font-semibold text-brand-text">
                  ${parseFloat(user.subscription.amount || 0).toFixed(2)}
                </p>
              </div>
              {user.subscription.renewalDate && (
                <div>
                  <p className="text-xs text-brand-text-muted">Renewal Date</p>
                  <p className="text-base font-semibold text-brand-text">
                    {new Date(user.subscription.renewalDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Charity Selection */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-brand-green">
            <Heart size={20} /> Charity & Contribution
          </h2>
          <div className="space-y-6">
            <div>
              <p className="text-xs text-brand-text-muted">Selected Charity</p>
              <p className="text-base font-semibold text-brand-text">
                {user.selectedCharity?.name || 'Not selected'}
              </p>
              {user.selectedCharity?.category && (
                <p className="text-xs text-brand-text-muted">{user.selectedCharity.category}</p>
              )}
            </div>

            {user.subscription.status === 'active' && (
              <div className="rounded-lg border border-brand-gold/20 bg-brand-gold/5 p-4">
                <label className="mb-3 block text-sm font-semibold text-brand-green">
                  Contribution Percentage (%)
                </label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    min="10"
                    max="100"
                    step="10"
                    value={editingPercent}
                    onChange={(e) => setEditingPercent(parseInt(e.target.value) || 0)}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-brand-text focus:border-brand-green focus:outline-none"
                  />
                  <button
                    onClick={handleUpdateCharity}
                    disabled={submitting || editingPercent === user.charityContributionPercent}
                    className="rounded-lg bg-brand-gold px-4 py-2 font-semibold text-white transition-all hover:bg-brand-gold/90 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Golf Scores */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-brand-green">
            <Trophy size={20} /> Golf Scores
          </h2>

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-brand-bg p-4">
              <p className="text-xs text-brand-text-muted">Total Scores</p>
              <p className="text-3xl font-bold text-brand-green">{user.golfScores.count}</p>
            </div>
            <div className="rounded-lg bg-brand-bg p-4">
              <p className="text-xs text-brand-text-muted">Average Score</p>
              <p className="text-3xl font-bold text-brand-gold">
                {user.golfScores.averageScore || '—'}
              </p>
            </div>
            <div className="rounded-lg bg-brand-bg p-4">
              <p className="text-xs text-brand-text-muted">Best Score</p>
              <p className="text-3xl font-bold text-brand-green">
                {user.golfScores.bestScore || '—'}
              </p>
            </div>
          </div>

          {user.golfScores.scores.length > 0 ? (
            <div className="space-y-2">
              {user.golfScores.scores.map((score) => (
                <div
                  key={score._id || score.rank}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-4"
                >
                  <div>
                    <p className="font-semibold text-brand-text">Score: {score.value}</p>
                    <p className="text-xs text-brand-text-muted">
                      {new Date(score.date).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteScore(score._id)}
                    disabled={submitting}
                    className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-200 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-brand-text-muted">No golf scores recorded</p>
          )}
        </div>

        {/* Donations */}
        {user.donations.count > 0 && (
          <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-brand-green">
              <Heart size={20} /> Donation History
            </h2>
            <p className="text-base text-brand-text">Total donations: {user.donations.count}</p>
          </div>
        )}

        {/* Subscription History */}
        {user.subscriptionHistory.length > 0 && (
          <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-brand-green">
              <Calendar size={20} /> Subscription History
            </h2>
            <div className="space-y-4">
              {user.subscriptionHistory.map((history, idx) => (
                <div key={idx} className="border-l-4 border-brand-gold bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-brand-text capitalize">{history.action}</p>
                      <p className="text-xs text-brand-text-muted">
                        {new Date(history.createdAt).toLocaleDateString()} at{' '}
                        {new Date(history.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-brand-gold">${history.amount?.toFixed(2)}</p>
                      <p className="text-xs text-brand-text-muted capitalize">{history.status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delete User */}
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h2 className="mb-4 font-bold text-red-700">Danger Zone</h2>
          <p className="mb-4 text-sm text-red-600">
            Deleting a user will permanently remove all their data including scores, subscriptions, and donations. This action cannot be undone.
          </p>
          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-red-700"
            >
              Delete User
            </button>
          ) : (
            <div className="space-y-3">
              <p className="font-semibold text-red-700">Are you absolutely sure?</p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteUser}
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin inline-block mr-2" /> Deleting...
                    </>
                  ) : (
                    'Yes, Delete User'
                  )}
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  disabled={submitting}
                  className="flex-1 rounded-lg border border-red-300 px-4 py-2 font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
