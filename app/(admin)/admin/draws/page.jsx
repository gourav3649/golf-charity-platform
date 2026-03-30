'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Zap,
  Plus,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Clock,
  Trophy,
  ChevronDown,
  X,
} from 'lucide-react';

export default function AdminDrawsPage() {
  const [draws, setDraws] = useState([]);
  const [expandedDraw, setExpandedDraw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    drawType: 'random',
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchDraws = async () => {
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

        // Fetch draws
        const drawsRes = await fetch('/api/admin/draws');
        if (drawsRes.ok) {
          const data = await drawsRes.json();
          setDraws(data.data.draws || []);
        } else {
          setError('Failed to load draws');
        }
      } catch (err) {
        console.error('Error fetching draws:', err);
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDraws();
  }, [router]);

  const handleCreateDraw = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const res = await fetch('/api/draws/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: currentMonth,
          drawType: formData.drawType,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Failed to create draw');
        setSubmitting(false);
        return;
      }

      const data = await res.json();
      setDraws([data.data.draw, ...draws]);
      setFormData({ drawType: 'random' });
      setShowCreateForm(false);
      setSuccess('Draw created successfully');
    } catch (err) {
      setError('An error occurred while creating draw');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulateDraw = async (drawId) => {
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/draws/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drawId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Failed to simulate draw');
        setSubmitting(false);
        return;
      }

      const data = await res.json();
      setDraws(draws.map((d) => (d._id === drawId ? data.data.draw : d)));
      setSuccess('Draw simulated successfully');
    } catch (err) {
      setError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishDraw = async (drawId) => {
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/draws/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drawId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Failed to publish draw');
        setSubmitting(false);
        return;
      }

      const data = await res.json();
      setDraws(draws.map((d) => (d._id === drawId ? data.data.draw : d)));
      setSuccess('Draw published successfully');
    } catch (err) {
      setError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 h-10 w-40 animate-pulse rounded-lg bg-slate-800"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-slate-800"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 px-4 py-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold text-white">Draw Management</h1>
            <p className="text-slate-400">Create, simulate, and publish monthly draws</p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/admin"
              className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
            >
              ← Back to Admin
            </Link>
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-yellow-600 to-orange-600 px-4 py-2 font-semibold text-white transition-all hover:shadow-lg hover:shadow-yellow-500/25"
              >
                <Plus size={16} /> Create Draw
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-8 flex gap-3 rounded-lg bg-red-600/10 p-4 ring-1 ring-red-600/20">
            <AlertCircle size={16} className="flex-shrink-0 text-red-400" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-8 flex gap-3 rounded-lg bg-green-600/10 p-4 ring-1 ring-green-600/20">
            <CheckCircle2 size={16} className="flex-shrink-0 text-green-400" />
            <p className="text-sm text-green-300">{success}</p>
          </div>
        )}

        {/* Create Draw Form */}
        {showCreateForm && (
          <div className="mb-8 rounded-xl border border-slate-800 bg-slate-900/50 p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Create New Draw</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="rounded-lg p-2 transition-colors hover:bg-slate-800"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateDraw} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-white">Draw Type *</label>
                <select
                  value={formData.drawType}
                  onChange={(e) => setFormData({ ...formData, drawType: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-white focus:border-blue-600 focus:outline-none"
                  required
                >
                  <option value="random">Random Draw</option>
                  <option value="algorithmic">Algorithmic Draw</option>
                </select>
                <p className="mt-2 text-xs text-slate-400">Current month: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 py-3 font-bold text-white transition-all hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin inline-block mr-2" /> Creating...
                    </>
                  ) : (
                    'Create Draw'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 rounded-lg border border-slate-700 py-3 font-bold text-white transition-colors hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Draws List */}
        <div className="space-y-4">
          {draws.length > 0 ? (
            draws.map((draw) => (
              <div
                key={draw._id}
                className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden"
              >
                {/* Draw Header */}
                <button
                  onClick={() =>
                    setExpandedDraw(expandedDraw === draw._id ? null : draw._id)
                  }
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Trophy className="text-yellow-400" size={24} />
                    <div className="text-left">
                      <h3 className="font-bold text-white">
                        {new Date(draw.createdAt).toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric',
                        })}
                        {draw.year && ` ${draw.year}`}
                      </h3>
                      <p className="text-sm text-slate-400">Prize Pool: ${(draw.prizePool?.totalPool || 0).toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {draw.status === 'published' ? (
                        <>
                          <CheckCircle2 size={16} className="text-green-400" />
                          <span className="text-sm font-medium text-green-300">Published</span>
                        </>
                      ) : draw.status === 'simulated' ? (
                        <>
                          <Clock size={16} className="text-yellow-400" />
                          <span className="text-sm font-medium text-yellow-300">Simulated</span>
                        </>
                      ) : (
                        <span className="text-sm font-medium text-slate-400">Created</span>
                      )}
                    </div>
                    <ChevronDown
                      size={20}
                      className={`text-slate-400 transition-transform ${
                        expandedDraw === draw._id ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Draw Details */}
                {expandedDraw === draw._id && (
                  <div className="border-t border-slate-700 px-6 py-6 space-y-6">
                    {/* Winners (if published) */}
                    {draw.status === 'published' && draw.winners && draw.winners.length > 0 && (
                      <div>
                        <h4 className="mb-3 font-semibold text-white">Winners</h4>
                        <div className="space-y-2">
                          {draw.winners.slice(0, 5).map((winner, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between rounded-lg bg-slate-800/30 p-3"
                            >
                              <span className="text-sm text-slate-300">
                                {winner.matches} match{winner.matches !== 1 ? 'es' : ''}
                              </span>
                              <span className="font-bold text-green-400">
                                ${winner.prizeAmount.toFixed(2)}
                              </span>
                            </div>
                          ))}
                          {draw.winners.length > 5 && (
                            <p className="text-xs text-slate-400">
                              +{draw.winners.length - 5} more winners
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      {draw.status === 'pending' && (
                        <button
                          onClick={() => handleSimulateDraw(draw._id)}
                          disabled={submitting}
                          className="flex-1 rounded-lg bg-yellow-600/20 px-4 py-2 font-semibold text-yellow-300 transition-colors hover:bg-yellow-600/30 disabled:opacity-50"
                        >
                          {submitting ? 'Simulating...' : 'Simulate'}
                        </button>
                      )}
                      {draw.status === 'simulated' && (
                        <button
                          onClick={() => handlePublishDraw(draw._id)}
                          disabled={submitting}
                          className="flex-1 rounded-lg bg-green-600/20 px-4 py-2 font-semibold text-green-300 transition-colors hover:bg-green-600/30 disabled:opacity-50"
                        >
                          {submitting ? 'Publishing...' : 'Publish'}
                        </button>
                      )}
                      {draw.status === 'published' && (
                        <Link
                          href={`/admin/draws/${draw._id}`}
                          className="flex-1 rounded-lg bg-blue-600/20 px-4 py-2 text-center font-semibold text-blue-300 transition-colors hover:bg-blue-600/30"
                        >
                          View Details
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-6 py-12 text-center">
              <Zap size={48} className="mx-auto mb-4 text-slate-600" />
              <p className="text-slate-400">No draws created yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
