'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const usersPerPage = 10;
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
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

        // Fetch users
        const usersRes = await fetch('/api/admin/users');
        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(data.data.users || []);
          setFilteredUsers(data.data.users || []);
        } else {
          setError('Failed to load users');
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [router]);

  useEffect(() => {
    // Filter users based on search and status
    let filtered = users;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.firstName.toLowerCase().includes(query) ||
          user.lastName.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((user) => user.subscription?.status === filterStatus);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchQuery, filterStatus, users]);

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    setDeleting(userId);
    setError('');
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (res.ok) {
        setUsers(users.filter((u) => u._id !== userId));
        alert('User deleted successfully');
      } else {
        setError(data.message || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('An error occurred while deleting user');
    } finally {
      setDeleting(null);
    }
  };

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 h-10 w-40 animate-pulse rounded-lg bg-gray-300"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-200"></div>
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
            <h1 className="mb-2 text-4xl font-bold text-brand-green">User Management</h1>
            <p className="text-brand-text-muted">Manage registered users and subscriptions</p>
          </div>
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
        </div>

        {error && (
          <div className="mb-8 flex gap-3 rounded-lg bg-red-50 p-4 ring-1 ring-red-200">
            <AlertCircle size={16} className="flex-shrink-0 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Search */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-3 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-brand-text placeholder-gray-400 focus:border-brand-green focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-brand-text focus:border-brand-green focus:outline-none"
          >
            <option value="all">All Users</option>
            <option value="active">Active Subscriptions</option>
            <option value="cancelled">Cancelled</option>
            <option value="lapsed">Lapsed</option>
          </select>

          {/* Results count */}
          <div className="flex items-center justify-end rounded-lg border border-gray-200 bg-white px-4">
            <span className="text-sm text-brand-text-muted">
              {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Users Table */}
        <div className="mb-8 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          {filteredUsers.length > 0 ? (
            <>
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-brand-green">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-brand-green">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-brand-green">
                      Subscription
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-brand-green">
                      Charity
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-brand-green">
                      Joined
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-brand-green">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-brand-green">
                          {user.firstName} {user.lastName}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-brand-text">{user.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {user.subscription?.status === 'active' ? (
                            <>
                              <CheckCircle2 size={14} className="text-brand-green" />
                              <span className="text-sm font-medium text-brand-green">Active</span>
                            </>
                          ) : user.subscription?.status === 'lapsed' ? (
                            <>
                              <Clock size={14} className="text-brand-gold" />
                              <span className="text-sm font-medium text-brand-gold">Lapsed</span>
                            </>
                          ) : (
                            <span className="text-sm text-brand-text-muted">None</span>
                          )}
                        </div>
                        {user.subscription?.plan && (
                          <p className="text-xs text-brand-text-muted capitalize">
                            {user.subscription.plan}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-brand-text">
                          {user.selectedCharityId?.name || 'Not selected'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-brand-text-muted">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/users/${user._id}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-brand-gold text-brand-gold px-3 py-1.5 text-xs font-medium transition-colors hover:bg-brand-gold/10"
                          >
                            <Eye size={14} /> View
                          </Link>
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            disabled={deleting === user._id}
                            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                          >
                            {deleting === user._id ? (
                              <>
                                <Loader2 size={14} className="animate-spin" />
                              </>
                            ) : (
                              <>
                                <Trash2 size={14} /> Delete
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-brand-green transition-colors hover:border-brand-green disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>

                  <span className="text-sm text-brand-text-muted">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-brand-green transition-colors hover:border-brand-green disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="px-6 py-12 text-center">
              <Users size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-brand-text-muted">No users found matching your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
