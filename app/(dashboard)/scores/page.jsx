'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ScoresPage() {
  const [scores, setScores] = useState([]);
  const [newScore, setNewScore] = useState('');
  const [scoreDate, setScoreDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  // Fetch scores
  useEffect(() => {
    const fetchScores = async () => {
      try {
        const res = await fetch('/api/scores');
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch scores');
        }

        const data = await res.json();
        setScores(data.data.scores || []);
      } catch (err) {
        setError('Failed to load scores');
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, [router]);

  const handleAddScore = async (e) => {
    // Fixed: safe event handler
    e?.preventDefault?.();
    setError('');
    setSuccess('');
    setSubmitting(true);

    // Validation
    const scoreValue = parseInt(newScore);
    if (!newScore || scoreValue < 1 || scoreValue > 45) {
      setError('Score must be between 1 and 45');
      setSubmitting(false);
      return;
    }

    if (!scoreDate) {
      setError('Please select a date');
      setSubmitting(false);
      return;
    }

    const selectedDate = new Date(scoreDate);
    const today = new Date();
    if (selectedDate > today) {
      setError('Cannot log scores for future dates');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: scoreValue,
          date: scoreDate,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Failed to add score');
        setSubmitting(false);
        return;
      }

      const data = await res.json();
      setScores(data.data.scores || []);
      setNewScore('');
      setScoreDate(new Date().toISOString().split('T')[0]);
      setSuccess('Score added successfully!');

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('An error occurred while adding the score');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteScore = async (scoreId) => {
    if (!confirm('Are you sure you want to delete this score?')) return;

    try {
      const res = await fetch(`/api/scores/${scoreId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        setError('Failed to delete score');
        return;
      }

      const data = await res.json();
      setScores(data.data.scores || []);
      setSuccess('Score deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('An error occurred while deleting the score');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 h-10 w-32 animate-pulse rounded-lg bg-gray-300"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const average =
    scores.length > 0 ? (scores.reduce((sum, s) => sum + s.value, 0) / scores.length).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-brand-bg px-4 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold text-brand-green">Golf Scores</h1>
            <p className="text-brand-text-muted">Track and manage your golf scores. We keep your 5 most recent.</p>
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

        {/* Summary Cards */}
        {scores.length > 0 && (
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-brand-text-muted">Average Score</p>
              <p className="mt-1 text-3xl font-bold text-brand-gold">{average}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-brand-text-muted">Best Score</p>
              <p className="mt-1 text-3xl font-bold text-brand-green">
                {Math.max(...scores.map(s => s.value))}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-brand-text-muted">Total Logged</p>
              <p className="mt-1 text-3xl font-bold text-brand-gold">{scores.length}</p>
            </div>
          </div>
        )}

        <div className="mb-8 grid gap-8 lg:grid-cols-3">
          {/* Add Score Form */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-1">
            <h2 className="mb-4 flex items-center gap-2 font-bold text-brand-green">
              <Plus size={20} /> Add Score
            </h2>

            {error && (
              <div className="mb-4 flex gap-3 rounded-lg bg-red-50 p-4 ring-1 ring-red-200">
                <AlertCircle size={16} className="flex-shrink-0 text-red-600" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 flex gap-3 rounded-lg bg-green-50 p-4 ring-1 ring-green-200">
                <CheckCircle2 size={16} className="flex-shrink-0 text-green-600" />
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            <form onSubmit={handleAddScore} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-brand-green">
                  Score (1-45)
                </label>
                <input
                  type="number"
                  min="1"
                  max="45"
                  value={newScore}
                  onChange={(e) => setNewScore(e.target.value)}
                  placeholder="Enter score"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-brand-text placeholder-gray-400 transition-all focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-brand-green">Date</label>
                <input
                  type="date"
                  value={scoreDate}
                  onChange={(e) => setScoreDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-brand-text transition-all focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                />
              </div>

              <div className="rounded-lg bg-brand-bg p-4">
                <p className="text-xs text-brand-text-muted">
                  💡 <span className="font-semibold">Tip:</span> Scores are automatically sorted. We keep your 5 most recent.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-brand-gold py-2 font-bold text-white transition-all hover:bg-brand-gold/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Adding...' : 'Add Score'}
              </button>
            </form>
          </div>

          {/* Scores List */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="mb-4 flex items-center gap-2 font-bold text-brand-green">
              <TrendingUp size={20} /> Your Scores
            </h2>

            {scores.length > 0 ? (
              <div className="space-y-3">
                {scores.map((score, idx) => (
                  <div
                    key={score._id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-gold text-white">
                        <span className="text-lg font-bold">#{idx + 1}</span>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-brand-green">{score.value}</p>
                        <p className="text-xs text-brand-text-muted">
                          {new Date(score.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteScore(score._id)}
                      className="rounded-lg p-2 text-brand-text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                      aria-label="Delete score"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <TrendingUp size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-brand-text-muted">No scores logged yet.</p>
                <p className="text-xs text-gray-400">
                  Add your first score using the form on the left!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-3 font-bold text-brand-green">Scoring Guidelines</h3>
          <ul className="space-y-2 text-sm text-brand-text">
            <li>✅ Scores must be between 1-45 (Stableford scoring)</li>
            <li>✅ We keep your 5 most recent scores automatically</li>
            <li>✅ You can delete scores anytime</li>
            <li>✅ Scores are used in monthly draw matching</li>
            <li>✅ Date cannot be in the future</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
