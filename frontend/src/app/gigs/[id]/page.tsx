'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { getGigDetails, createOrder } from '../../../lib/api';
import type { GigWithRelations, GigPackage } from '../../../lib/types';

export default function GigDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const gigId = parseInt(params.id);

  const [gig, setGig] = useState<GigWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [ordering, setOrdering] = useState<number | null>(null);
  const [orderSuccess, setOrderSuccess] = useState('');
  const [orderError, setOrderError] = useState('');

  useEffect(() => {
    getGigDetails(gigId)
      .then(setGig)
      .catch(() => setError('Gig not found or backend unavailable.'))
      .finally(() => setIsLoading(false));
  }, [gigId]);

  const handleOrder = async (pkg: GigPackage) => {
    if (!session) {
      setOrderError('Please sign in to place an order.');
      return;
    }
    setOrdering(pkg.id);
    setOrderError('');
    setOrderSuccess('');
    try {
      await createOrder(pkg.id);
      setOrderSuccess(`Order placed for the ${pkg.tier} package!`);
    } catch (err: any) {
      setOrderError(err.message || 'Failed to place order.');
    } finally {
      setOrdering(null);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-2/3 mb-4" />
        <div className="h-4 bg-gray-100 rounded w-full mb-2" />
        <div className="h-4 bg-gray-100 rounded w-5/6 mb-8" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-48 bg-gray-100 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (error || !gig) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-gray-500">
        <p className="text-lg">{error || 'Gig not found.'}</p>
        <Link href="/gigs" className="mt-4 inline-block text-primary hover:underline text-sm">
          Back to gigs
        </Link>
      </div>
    );
  }

  const packages = gig.packages ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-400">
        <Link href="/gigs" className="hover:text-primary">Gigs</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">{gig.title}</span>
      </nav>

      {/* Gig header */}
      <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {gig.subcategory && (
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {gig.subcategory.category?.name} › {gig.subcategory.name}
              </span>
            )}
            <h1 className="mt-3 text-2xl font-extrabold text-gray-900">{gig.title}</h1>
            {gig.freelancer?.user && (
              <Link
                href={`/freelancers/${gig.freelancer_id}`}
                className="mt-1 inline-block text-sm text-primary hover:underline"
              >
                by {gig.freelancer.user.first_name} {gig.freelancer.user.last_name}
              </Link>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-gray-400">Starting at</p>
            <p className="text-2xl font-bold text-gray-900">${gig.base_price}</p>
          </div>
        </div>
        <p className="mt-4 text-gray-600 leading-relaxed whitespace-pre-line">{gig.description}</p>
      </div>

      {/* Order feedback */}
      {orderSuccess && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-md p-3">
          {orderSuccess} <Link href="/dashboard" className="underline font-medium">View in Dashboard</Link>
        </div>
      )}
      {orderError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md p-3">
          {orderError} {!session && <Link href="/login" className="underline font-medium">Sign in</Link>}
        </div>
      )}

      {/* Packages */}
      {packages.length > 0 ? (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Choose a Package</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {packages.map((pkg, idx) => {
              const isMiddle = idx === 1;
              return (
                <div
                  key={pkg.id}
                  className={`bg-white border rounded-lg p-5 flex flex-col shadow-sm ${isMiddle ? 'border-primary ring-1 ring-primary' : 'border-gray-100'}`}
                >
                  {isMiddle && (
                    <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Most Popular</div>
                  )}
                  <h3 className="text-base font-bold text-gray-900">{pkg.tier}</h3>
                  <p className="text-2xl font-extrabold text-gray-900 mt-1">${pkg.price}</p>
                  <p className="text-xs text-gray-400 mb-3">{pkg.delivery_days} day delivery</p>
                  <p className="text-sm text-gray-600 flex-1">{pkg.description}</p>
                  <button
                    onClick={() => handleOrder(pkg)}
                    disabled={ordering === pkg.id}
                    className={`mt-5 w-full py-2 px-4 rounded-md text-sm font-semibold transition-colors disabled:opacity-50 ${isMiddle ? 'bg-primary text-white hover:bg-primary-dark' : 'border border-primary text-primary hover:bg-primary/5'}`}
                  >
                    {ordering === pkg.id ? 'Placing order…' : `Order ${pkg.tier}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-6 text-center text-gray-400 text-sm">
          No packages have been added to this gig yet.
        </div>
      )}

      {/* Freelancer card */}
      {gig.freelancer && (
        <div className="mt-8 bg-white border border-gray-100 rounded-lg p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-3">About the Freelancer</h2>
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
              {gig.freelancer.user?.first_name?.[0] ?? '?'}
            </div>
            <div>
              <Link href={`/freelancers/${gig.freelancer_id}`} className="font-semibold text-gray-900 hover:text-primary">
                {gig.freelancer.user
                  ? `${gig.freelancer.user.first_name} ${gig.freelancer.user.last_name}`
                  : 'Freelancer'}
              </Link>
              {gig.freelancer.hourly_rate && (
                <p className="text-sm text-gray-500">${gig.freelancer.hourly_rate}/hr</p>
              )}
              {gig.freelancer.bio && (
                <p className="mt-2 text-sm text-gray-600 line-clamp-3">{gig.freelancer.bio}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
