'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getOrders, getProfile, updateProfile, updateOrderStatus, postReview } from '../../lib/api';
import type { OrderWithRelations, UserWithProfile } from '../../lib/types';

type Tab = 'orders' | 'profile';

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  In_Progress: 'bg-blue-100 text-blue-800',
  Completed: 'bg-green-100 text-green-800',
  Cancelled: 'bg-gray-100 text-gray-500',
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('orders');
  const [orders, setOrders] = useState<OrderWithRelations[]>([]);
  const [profile, setProfile] = useState<UserWithProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Profile edit state
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', bio: '', portfolio_url: '', hourly_rate: '', company_name: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Review state
  const [reviewingOrder, setReviewingOrder] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    Promise.all([getOrders(), getProfile()])
      .then(([ord, prof]) => {
        setOrders(ord);
        setProfile(prof);
        setProfileForm({
          first_name: prof.first_name ?? '',
          last_name: prof.last_name ?? '',
          bio: prof.freelancer?.bio ?? '',
          portfolio_url: prof.freelancer?.portfolio_url ?? '',
          hourly_rate: prof.freelancer?.hourly_rate?.toString() ?? '',
          company_name: prof.client?.company_name ?? '',
        });
      })
      .catch(() => setError('Failed to load data. Is the backend running?'))
      .finally(() => setIsLoading(false));
  }, [status]);

  const handleStatusChange = async (orderId: number, newStatus: 'In_Progress' | 'Completed' | 'Cancelled') => {
    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...updated } : o)));
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleReview = async (orderId: number) => {
    try {
      const review = await postReview(orderId, reviewRating, reviewComment);
      setReviewingOrder(null);
      setReviewComment('');
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, review } : o));
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const isFreelancer = !!profile?.freelancer;
      const payload: Record<string, any> = {
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
      };
      if (isFreelancer) {
        if (profileForm.bio) payload.bio = profileForm.bio;
        if (profileForm.portfolio_url) payload.portfolio_url = profileForm.portfolio_url;
        if (profileForm.hourly_rate) payload.hourly_rate = parseFloat(profileForm.hourly_rate);
      } else {
        if (profileForm.company_name) payload.company_name = profileForm.company_name;
      }
      const updated = await updateProfile(payload);
      setProfile(updated);
      setSaveSuccess(true);
    } catch (err: any) {
      alert(err.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-lg" />)}
        </div>
      </div>
    );
  }

  const isFreelancer = !!profile?.freelancer;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">Dashboard</h1>
        {isFreelancer && (
          <Link href="/gigs/create" className="bg-primary text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-primary-dark transition-colors shadow-sm">
            + Create Gig
          </Link>
        )}
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md p-3">{error}</div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {(['orders', 'profile'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3 text-sm font-medium border-b-2 capitalize transition-colors ${tab === t ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {t}
            </button>
          ))}
        </nav>
      </div>

      {/* Orders tab */}
      {tab === 'orders' && (
        <div>
          {orders.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg font-medium">No orders yet</p>
              <p className="text-sm mt-1">
                {isFreelancer ? 'Your orders from clients will appear here.' : <>Browse <Link href="/gigs" className="text-primary hover:underline">gigs</Link> to place your first order.</>}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 mb-1">Order #{order.id}</p>
                      <p className="font-semibold text-gray-900">
                        {order.gig_package?.gig?.title ?? `Package #${order.gig_package_id}`}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Tier: {order.gig_package?.tier ?? '—'} · ${order.total_amount}
                        {order.due_date && ` · Due ${new Date(order.due_date).toLocaleDateString()}`}
                      </p>
                    </div>
                    <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Status actions */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {order.status === 'Pending' && (
                      <>
                        {isFreelancer && (
                          <button onClick={() => handleStatusChange(order.id, 'In_Progress')} className="text-xs px-3 py-1 border border-blue-300 text-blue-600 rounded-md hover:bg-blue-50 transition-colors">
                            Start Work
                          </button>
                        )}
                        <button onClick={() => handleStatusChange(order.id, 'Cancelled')} className="text-xs px-3 py-1 border border-gray-300 text-gray-500 rounded-md hover:bg-gray-50 transition-colors">
                          Cancel
                        </button>
                      </>
                    )}
                    {order.status === 'In_Progress' && !isFreelancer && (
                      <button onClick={() => handleStatusChange(order.id, 'Completed')} className="text-xs px-3 py-1 border border-green-300 text-green-600 rounded-md hover:bg-green-50 transition-colors">
                        Mark Complete
                      </button>
                    )}
                    {order.status === 'Completed' && !isFreelancer && !order.review && (
                      <button onClick={() => setReviewingOrder(order.id)} className="text-xs px-3 py-1 border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors">
                        Leave Review
                      </button>
                    )}
                    {order.review && (
                      <span className="text-xs text-gray-400">Review: {'★'.repeat(order.review.rating)} {order.review.comment}</span>
                    )}
                  </div>

                  {/* Inline review form */}
                  {reviewingOrder === order.id && (
                    <div className="mt-4 bg-gray-50 rounded-md p-4 border border-gray-200 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Rating</label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button key={n} type="button" onClick={() => setReviewRating(n)}
                              className={`text-lg ${n <= reviewRating ? 'text-yellow-400' : 'text-gray-300'}`}>★</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Comment (optional)</label>
                        <textarea rows={2} value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleReview(order.id)} className="text-xs px-3 py-1.5 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors">
                          Submit Review
                        </button>
                        <button onClick={() => setReviewingOrder(null)} className="text-xs px-3 py-1.5 border border-gray-300 text-gray-500 rounded-md hover:bg-gray-50 transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile tab */}
      {tab === 'profile' && profile && (
        <form onSubmit={handleProfileSave} className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
              {profile.first_name?.[0] ?? '?'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{profile.first_name} {profile.last_name}</p>
              <p className="text-sm text-gray-400">{profile.email} · {isFreelancer ? 'Freelancer' : 'Client'}</p>
            </div>
          </div>

          {saveSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-md p-3">
              Profile saved successfully.
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input type="text" value={profileForm.first_name} onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input type="text" value={profileForm.last_name} onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary" />
            </div>
          </div>

          {isFreelancer && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                <textarea rows={3} value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Portfolio URL</label>
                  <input type="url" value={profileForm.portfolio_url} onChange={(e) => setProfileForm({ ...profileForm, portfolio_url: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hourly Rate ($)</label>
                  <input type="number" min="0" step="0.01" value={profileForm.hourly_rate} onChange={(e) => setProfileForm({ ...profileForm, hourly_rate: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary" />
                </div>
              </div>
            </>
          )}

          {!isFreelancer && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Name</label>
              <input type="text" value={profileForm.company_name} onChange={(e) => setProfileForm({ ...profileForm, company_name: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary" />
            </div>
          )}

          <button type="submit" disabled={isSaving}
            className="w-full py-2 px-4 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50">
            {isSaving ? 'Saving…' : 'Save Profile'}
          </button>
        </form>
      )}
    </div>
  );
}
