'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getGigs, getCategories } from '../../lib/api';
import type { GigWithRelations, CategoryWithSubs } from '../../lib/types';

function GigsContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') ?? '';

  const [gigs, setGigs] = useState<GigWithRelations[]>([]);
  const [categories, setCategories] = useState<CategoryWithSubs[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setError('');
    const params: { category_id?: number; subcategory_id?: number } = {};
    if (selectedSubcategory) params.subcategory_id = selectedSubcategory;
    else if (selectedCategory) params.category_id = selectedCategory;

    getGigs(params)
      .then(setGigs)
      .catch(() => setError('Failed to load gigs. Is the backend running?'))
      .finally(() => setIsLoading(false));
  }, [selectedCategory, selectedSubcategory]);

  const subcategories = selectedCategory
    ? categories.find((c) => c.id === selectedCategory)?.subcategories ?? []
    : [];

  const q = searchQuery.trim().toLowerCase();
  const visibleGigs = q
    ? gigs.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.freelancer?.user?.first_name?.toLowerCase().includes(q) ||
          g.freelancer?.user?.last_name?.toLowerCase().includes(q),
      )
    : gigs;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Explore Gigs</h1>
        <p className="mt-1 text-gray-500">Find local talent across the Rio Grande Valley</p>
        <div className="mt-4 relative max-w-sm">
          <input
            type="text"
            placeholder="Search gigs…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-4 lg:gap-8">
        {/* Sidebar filters */}
        <aside className="mb-8 lg:mb-0">
          <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Categories</h2>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedCategory === null ? 'bg-primary text-white font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  All Categories
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => { setSelectedCategory(cat.id); setSelectedSubcategory(null); }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedCategory === cat.id && !selectedSubcategory ? 'bg-primary text-white font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {cat.name}
                  </button>
                  {selectedCategory === cat.id && cat.subcategories.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSubcategory(sub.id)}
                      className={`w-full text-left pl-6 pr-3 py-1.5 rounded-md text-sm transition-colors ${selectedSubcategory === sub.id ? 'text-primary font-semibold' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                      {sub.name}
                    </button>
                  ))}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Gig grid */}
        <div className="lg:col-span-3">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-md p-4 mb-6">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm animate-pulse">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-gray-100 rounded w-full mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-2/3 mb-4" />
                  <div className="h-8 bg-gray-200 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : visibleGigs.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg font-medium">No gigs found</p>
              <p className="text-sm mt-1">
                {searchQuery ? 'Try a different search term' : 'Try a different category or check back later'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {visibleGigs.map((gig) => (
                <Link
                  key={gig.id}
                  href={`/gigs/${gig.id}`}
                  className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {gig.subcategory?.category?.name ?? gig.subcategory?.name ?? 'Gig'}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 mb-1">
                    {gig.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">{gig.description}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">Starting at</p>
                      <p className="text-lg font-bold text-gray-900">${gig.base_price}</p>
                    </div>
                    {gig.freelancer?.user && (
                      <p className="text-xs text-gray-400">
                        by {gig.freelancer.user.first_name} {gig.freelancer.user.last_name}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GigsPage() {
  return (
    <Suspense>
      <GigsContent />
    </Suspense>
  );
}
