'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Heart,
  Plus,
  AlertCircle,
  Loader2,
  Trash2,
  Edit2,
  Search,
  X,
} from 'lucide-react';

export default function AdminCharitiesPage() {
  const [charities, setCharities] = useState([]);
  const [filteredCharities, setFilteredCharities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    website: '',
    contactEmail: '',
  });
  const router = useRouter();

  useEffect(() => {
    const fetchCharities = async () => {
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

        // Fetch charities
        const charRes = await fetch('/api/charities?limit=100');
        if (charRes.ok) {
          const data = await charRes.json();
          setCharities(data.data.charities || []);
          setFilteredCharities(data.data.charities || []);
        } else {
          setError('Failed to load charities');
        }
      } catch (err) {
        console.error('Error fetching charities:', err);
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCharities();
  }, [router]);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      setFilteredCharities(
        charities.filter(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            c.description.toLowerCase().includes(query) ||
            c.category.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredCharities(charities);
    }
  }, [searchQuery, charities]);

  const handleAddCharity = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/charities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Failed to add charity');
        setSubmitting(false);
        return;
      }

      const data = await res.json();
      setCharities([data.data.charity, ...charities]);
      setFormData({
        name: '',
        description: '',
        category: '',
        website: '',
        contactEmail: '',
      });
      setShowForm(false);
      setSuccess('Charity added successfully');
    } catch (err) {
      setError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCharity = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await fetch(`/api/charities/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Failed to update charity');
        setSubmitting(false);
        return;
      }

      const data = await res.json();
      setCharities(charities.map((c) => (c._id === editingId ? data.data.charity : c)));
      setFormData({
        name: '',
        description: '',
        category: '',
        website: '',
        contactEmail: '',
      });
      setShowForm(false);
      setEditingId(null);
      setSuccess('Charity updated successfully');
    } catch (err) {
      setError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCharity = async (charityId) => {
    if (!window.confirm('Are you sure you want to delete this charity?')) return;

    setDeleting(charityId);
    try {
      const res = await fetch(`/api/charities/${charityId}`, { method: 'DELETE' });
      if (res.ok) {
        setCharities(charities.filter((c) => c._id !== charityId));
        setSuccess('Charity deleted successfully');
      } else {
        setError('Failed to delete charity');
      }
    } catch (err) {
      console.error('Error deleting charity:', err);
      setError('An error occurred');
    } finally {
      setDeleting(null);
    }
  };

  const openEditForm = (charity) => {
    setEditingId(charity._id);
    setFormData({
      name: charity.name,
      description: charity.description,
      category: charity.category,
      website: charity.website || '',
      contactEmail: charity.contactEmail || '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      category: '',
      website: '',
      contactEmail: '',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 h-10 w-40 animate-pulse rounded-lg bg-slate-800"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-slate-800"></div>
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
            <h1 className="mb-2 text-4xl font-bold text-white">Charity Management</h1>
            <p className="text-slate-400">Manage registered charities</p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/admin"
              className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
            >
              ← Back to Admin
            </Link>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-pink-600 px-4 py-2 font-semibold text-white transition-all hover:shadow-lg hover:shadow-red-500/25"
              >
                <Plus size={16} /> Add Charity
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
            <AlertCircle size={16} className="flex-shrink-0 text-green-400" />
            <p className="text-sm text-green-300">{success}</p>
          </div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <div className="mb-8 rounded-xl border border-slate-800 bg-slate-900/50 p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                {editingId ? 'Edit Charity' : 'Add New Charity'}
              </h2>
              <button
                onClick={closeForm}
                className="rounded-lg p-2 transition-colors hover:bg-slate-800"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <form
              onSubmit={editingId ? handleEditCharity : handleAddCharity}
              className="space-y-6"
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-white">
                    Charity Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-white placeholder-slate-500 focus:border-blue-600 focus:outline-none"
                    placeholder="e.g., Red Cross"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-white focus:border-blue-600 focus:outline-none"
                    required
                  >
                    <option value="">Select category</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Environment">Environment</option>
                    <option value="Animal Welfare">Animal Welfare</option>
                    <option value="Poverty Relief">Poverty Relief</option>
                    <option value="Disaster Relief">Disaster Relief</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-white placeholder-slate-500 focus:border-blue-600 focus:outline-none"
                  placeholder="Tell us about this charity..."
                  rows="4"
                  required
                ></textarea>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-white">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-white placeholder-slate-500 focus:border-blue-600 focus:outline-none"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-white placeholder-slate-500 focus:border-blue-600 focus:outline-none"
                    placeholder="contact@example.com"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting || !formData.name || !formData.category || !formData.description}
                  className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 py-3 font-bold text-white transition-all hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin inline-block mr-2" />
                      {editingId ? 'Updating...' : 'Adding...'}
                    </>
                  ) : editingId ? (
                    'Update Charity'
                  ) : (
                    'Add Charity'
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 rounded-lg border border-slate-700 py-3 font-bold text-white transition-colors hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search */}
        <div className="mb-8 relative">
          <Search
            size={16}
            className="absolute left-3 top-3 text-slate-500"
          />
          <input
            type="text"
            placeholder="Search charities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/50 py-2 pl-10 pr-4 text-white placeholder-slate-500 focus:border-blue-600 focus:outline-none"
          />
        </div>

        {/* Charities Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCharities.length > 0 ? (
            filteredCharities.map((charity) => (
              <div
                key={charity._id}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-6"
              >
                <div className="mb-4 flex items-start justify-between">
                  <Heart className="text-red-400" size={24} />
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditForm(charity)}
                      className="rounded-lg bg-blue-600/20 p-2 transition-colors hover:bg-blue-600/30"
                    >
                      <Edit2 size={14} className="text-blue-300" />
                    </button>
                    <button
                      onClick={() => handleDeleteCharity(charity._id)}
                      disabled={deleting === charity._id}
                      className="rounded-lg bg-red-600/20 p-2 transition-colors hover:bg-red-600/30 disabled:opacity-50"
                    >
                      {deleting === charity._id ? (
                        <Loader2 size={14} className="text-red-300 animate-spin" />
                      ) : (
                        <Trash2 size={14} className="text-red-300" />
                      )}
                    </button>
                  </div>
                </div>

                <h3 className="mb-2 font-bold text-white">{charity.name}</h3>
                <p className="mb-3 inline-block rounded-full bg-slate-800/50 px-3 py-1 text-xs font-semibold text-slate-300">
                  {charity.category}
                </p>

                <p className="mb-4 text-sm text-slate-400">{charity.description}</p>

                <div className="space-y-2 border-t border-slate-700 pt-4">
                  {charity.website && (
                    <a
                      href={charity.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-blue-400 hover:text-blue-300 truncate"
                    >
                      {charity.website}
                    </a>
                  )}
                  {charity.contactEmail && (
                    <a
                      href={`mailto:${charity.contactEmail}`}
                      className="block text-xs text-slate-400 hover:text-slate-300 truncate"
                    >
                      {charity.contactEmail}
                    </a>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full rounded-xl border border-slate-800 bg-slate-900/50 px-6 py-12 text-center">
              <Heart size={48} className="mx-auto mb-4 text-slate-600" />
              <p className="text-slate-400">
                {charities.length === 0
                  ? 'No charities added yet'
                  : 'No charities match your search'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
