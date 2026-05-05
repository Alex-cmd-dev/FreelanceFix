'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getGigs, searchFreelancers } from '../../../lib/api';
import type { GigWithRelations, FreelancerWithUser } from '../../../lib/types';

export default function FreelancerProfilePage({ params }: { params: { id: string } }) {
  const freelancerId = params.id;

  const [freelancer, setFreelancer] = useState<FreelancerWithUser | null>(null);
  const [gigs, setGigs] = useState<GigWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      // searchFreelancers has no by-id endpoint, so we fetch all and filter
      searchFreelancers(),
      getGigs(),
    ])
      .then(([freelancers, allGigs]) => {
        const found = freelancers.find((f) => f.id === freelancerId);
        if (!found) {
          setError('Freelancer not found.');
          return;
        }
        setFreelancer(found);
        setGigs(allGigs.filter((g) => g.freelancer_id === freelancerId));
      })
      .catch(() => setError('Failed to load profile. Is the backend running?'))
      .finally(() => setIsLoading(false));
  }, [freelancerId]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
        <div className="flex items-center gap-5 mb-8">
          <div className="h-20 w-20 rounded-full bg-gray-200" />
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2" />
            <div className="h-4 bg-gray-100 rounded w-1/4" />
          </div>
        </div>
        <div className="h-4 bg-gray-100 rounded w-full mb-2" />
        <div className="h-4 bg-gray-100 rounded w-5/6" />
      </div>
    );
  }

  if (error || !freelancer) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-gray-500">
        <p className="text-lg">{error || 'Freelancer not found.'}</p>
        <Link href="/gigs" className="mt-4 inline-block text-primary hover:underline text-sm">
          Browse gigs
        </Link>
      </div>
    );
  }

  const displayName = freelancer.user
    ? `${freelancer.user.first_name} ${freelancer.user.last_name}`
    : `Freelancer #${freelancerId.slice(0, 6)}`;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Profile header */}
      <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm mb-8">
        <div className="flex items-start gap-5">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl shrink-0">
            {freelancer.user?.first_name?.[0] ?? '?'}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-gray-900">{displayName}</h1>
            {freelancer.hourly_rate && (
              <p className="text-sm text-gray-500 mt-0.5">${freelancer.hourly_rate}/hr</p>
            )}
            {freelancer.portfolio_url && (
              <a
                href={freelancer.portfolio_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-sm text-primary hover:underline"
              >
                View Portfolio
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>

        {freelancer.bio && (
          <div className="mt-5 border-t border-gray-100 pt-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">About</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{freelancer.bio}</p>
          </div>
        )}
      </div>

      {/* Gigs */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        {gigs.length > 0 ? `Gigs by ${freelancer.user?.first_name ?? 'this freelancer'}` : 'No gigs listed yet'}
      </h2>

      {gigs.length === 0 ? (
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-8 text-center text-gray-400 text-sm">
          This freelancer hasn&apos;t posted any gigs yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {gigs.map((gig) => (
            <Link
              key={gig.id}
              href={`/gigs/${gig.id}`}
              className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
            >
              {gig.subcategory && (
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {gig.subcategory.name}
                </span>
              )}
              <h3 className="mt-2 text-base font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                {gig.title}
              </h3>
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">{gig.description}</p>
              <div className="mt-3">
                <p className="text-xs text-gray-400">Starting at</p>
                <p className="text-lg font-bold text-gray-900">${gig.base_price}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
