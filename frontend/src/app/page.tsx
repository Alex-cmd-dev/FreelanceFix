'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getGigs } from '../lib/api';
import type { Gig } from '../lib/types';

export default function Home() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getGigs()
      .then((data) => setGigs(data))
      .catch(() => {
        // Backend not available, fail gracefully and keep array empty
        console.warn('Backend unavailable, showing placeholders');
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="bg-white min-h-[calc(100vh-64px)] flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 w-full">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl">
              <span className="block xl:inline">Local Talent for Local</span>{' '}
              <span className="block text-primary">Business in the RGV</span>
            </h1>
            <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
              The specialized digital marketplace connecting Rio Grande Valley freelancers with small business owners. Choose from transparent 3-tier gig pricing or post custom project briefs.
            </p>
            <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
              <Link href="/register" className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark shadow-sm transition-colors md:py-4 md:text-lg md:px-10">
                Post a Project
              </Link>
              <Link href="/login" className="ml-4 inline-flex items-center justify-center px-8 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors md:py-4 md:text-lg md:px-10">
                Sign In
              </Link>
            </div>
          </div>
          <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 flex lg:items-center justify-center">
            <div className="relative mx-auto w-full rounded-lg shadow-xl lg:max-w-md bg-white border border-gray-100 p-8">
               <div className="space-y-6">
                 {isLoading ? (
                   <div className="animate-pulse space-y-6">
                     <div className="h-8 bg-gray-200 rounded w-2/3"></div>
                     <div className="h-20 bg-gray-100 rounded border border-gray-100 w-full"></div>
                   </div>
                 ) : gigs.length > 0 ? (
                   <div>
                     {/* Dynamic rendering if backend starts returning data */}
                     <h3 className="text-xl font-bold text-gray-900">{gigs[0]?.title || 'Standard Gig'}</h3>
                     <p className="mt-2 text-sm text-gray-500 line-clamp-2">{gigs[0]?.description || 'High quality freelancer services starting here.'}</p>
                   </div>
                 ) : (
                   <>
                     <div className="h-8 bg-gray-100 rounded-md shadow-inner w-2/3"></div>
                     <div className="h-20 bg-gray-50 rounded-md border border-gray-100 shadow-sm w-full"></div>
                   </>
                 )}
                 <div className="grid grid-cols-3 gap-4">
                    <div className="h-32 bg-gray-50 border border-gray-100 rounded-md flex flex-col justify-end p-2"><div className="h-4 bg-gray-200 rounded w-full"></div></div>
                    <div className="h-32 bg-primary/10 border border-primary rounded-md shadow-sm relative overflow-hidden"><div className="absolute top-0 w-full h-1 bg-primary"></div><div className="absolute bottom-2 left-2 right-2 h-4 bg-primary/20 rounded"></div></div>
                    <div className="h-32 bg-gray-50 border border-gray-100 rounded-md flex flex-col justify-end p-2"><div className="h-4 bg-gray-200 rounded w-full"></div></div>
                 </div>
               </div>
               <p className="mt-6 text-sm text-gray-500 text-center font-medium">
                  {isLoading ? 'Connecting to APIs...' : 'Simple 3-Tier Package Previews'}
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
