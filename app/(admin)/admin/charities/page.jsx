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
    if (e && e.preventDefault) e.preventDefault();
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
    if (e && e.preventDefault) e.preventDefault();
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
      <div className="min-h-screen bg-brand-bg px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 h-10 w-40 animate-pulse rounded-lg bg-gray-300"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-200"></div>
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold text-brand-green">Charity Management</h1>
            <p className="text-brand-text-muted">Manage registered charities</p>
          </div>
          <div className="flex gap-4">
            <div className="flex gap-2">
              <Link
                href="/admin"
                className="flex items-center gap-2 rounded-lg border border-brand-green text-brand-green px-4 py-2 text-sm font-semibold transition-colors hover:bg-brand-green/10"
              >
                ← Back to Admin
              </Link>
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
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 rounded-lg bg-brand-gold px-4 py-2 font-semibold text-white transition-all hover:bg-brand-gold/90"
              >
                <Plus size={16} /> Add Charity
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-8 flex gap-3 rounded-lg bg-red-50 p-4 ring-1 ring-red-200">
            <AlertCircle size={16} className="flex-shrink-0 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-8 flex gap-3 rounded-lg bg-green-50 p-4 ring-1 ring-green-200">
            <AlertCircle size={16} className="flex-shrink-0 text-green-600" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <div className="mb-8 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-brand-green">
                {editingId ? 'Edit Charity' : 'Add New Charity'}
              </h2>
              <button
                onClick={closeForm}
                className="rounded-lg p-2 transition-colors hover:bg-gray-100"
              >
                <X size={20} className="text-brand-text-muted" />
              </button>
            </div>

            <form
              onSubmit={editingId ? handleEditCharity : handleAddCharity}
              className="space-y-6"
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-brand-green">
                    Charity Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-brand-text placeholder-gray-400 focus:border-brand-green focus:outline-none"
                    placeholder="e.g., Red Cross"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-brand-green">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-brand-text focus:border-brand-green focus:outline-none"
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
                <label className="block text-sm font-semibold text-brand-green">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-brand-text placeholder-gray-400 focus:border-brand-green focus:outline-none"
                  placeholder="Tell us about this charity..."
                  rows="4"
                  required
                ></textarea>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-brand-green">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-brand-text placeholder-gray-400 focus:border-brand-green focus:outline-none"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-brand-green">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-brand-text placeholder-gray-400 focus:border-brand-green focus:outline-none"
                    placeholder="contact@example.com"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting || !formData.name || !formData.category || !formData.description}
                  className="flex-1 rounded-lg bg-brand-gold py-3 font-bold text-white transition-all hover:bg-brand-gold/90 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="flex-1 rounded-lg border border-gray-300 py-3 font-bold text-brand-green transition-colors hover:bg-gray-50"
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
            className="absolute left-3 top-3 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search charities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-brand-text placeholder-gray-400 focus:border-brand-green focus:outline-none"
          />
        </div>

        {/* Charities Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCharities.length > 0 ? (
            filteredCharities.map((charity) => (
              <div
                key={charity._id}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between">
                  <Heart className="text-brand-gold" size={24} />
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditForm(charity)}
                      className="rounded-lg border border-brand-gold text-brand-gold p-2 transition-colors hover:bg-brand-gold/10"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteCharity(charity._id)}
                      disabled={deleting === charity._id}
                      className="rounded-lg bg-red-600 text-white p-2 transition-colors hover:bg-red-700 disabled:opacity-50"
                    >
                      {deleting === charity._id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                </div>

                <h3 className="mb-2 font-bold text-brand-green">{charity.name}</h3>
                <p className="mb-3 inline-block rounded-full bg-brand-bg px-3 py-1 text-xs font-semibold text-brand-text-muted">
                  {charity.category}
                </p>

                <p className="mb-4 text-sm text-brand-text">{charity.description}</p>

                <div className="space-y-2 border-t border-gray-200 pt-4">
                  {charity.website && (
                    <a
                      href={charity.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-brand-gold hover:text-brand-gold/80 truncate"
                    >
                      {charity.website}
                    </a>
                  )}
                  {charity.contactEmail && (
                    <a
                      href={`mailto:${charity.contactEmail}`}
                      className="block text-xs text-brand-text-muted hover:text-brand-text truncate"
                    >
                      {charity.contactEmail}
                    </a>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full rounded-xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
              <Heart size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-brand-text-muted">
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
