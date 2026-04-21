'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getGigs } from '../lib/api';
import type { Gig } from '../lib/types';

const MOCK_GIGS: Gig[] = [
  { id: 1, title: 'Professional Logo Design', description: 'I will create a stunning vector logo tailored for small practices.', base_price: 150, freelancer_id: 'mock-uuid-1', subcategory_id: 101 },
  { id: 2, title: 'Local SEO Optimization', description: 'Boost your RGV business ranking on Google Maps.', base_price: 200, freelancer_id: 'mock-uuid-2', subcategory_id: 201 },
];

export default function Home() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getGigs()
      .then((data) => {
         if (data && data.length > 0) {
            setGigs(data);
         } else {
            console.warn('API returned empty, using mock data.');
            setGigs(MOCK_GIGS);
         }
      })
      .catch(() => {
        console.warn('Backend unavailable, showing mock placeholders');
        setGigs(MOCK_GIGS);
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
            <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-1 max-w-sm rounded-md shadow-sm relative">
                 <input type="text" placeholder="Search freelancers or gigs..." className="w-full pl-4 pr-10 py-3 md:py-4 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-base" />
                 <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                       <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                 </div>
              </div>
              <Link href="/register" className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark shadow-sm transition-colors md:py-4 md:text-lg md:px-10">
                Post a Project
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
                   <div className="space-y-4">
                     {/* Show visual representation for the first mock gig */}
                     <h3 className="text-2xl font-bold text-gray-900">{gigs[0]?.title}</h3>
                     <p className="text-gray-500 line-clamp-2 pb-4 border-b border-gray-100">{gigs[0]?.description}</p>
                     
                     <div className="grid grid-cols-3 gap-4">
                        <div className="h-32 bg-gray-50 border border-gray-100 rounded-md flex flex-col justify-between p-3">
                           <span className="text-xs font-semibold text-gray-500 tracking-wider">BASIC</span>
                           <span className="text-lg font-bold text-gray-900">${gigs[0]?.base_price}</span>
                        </div>
                        <div className="h-32 bg-primary/5 border-2 border-primary rounded-md shadow-sm relative overflow-hidden flex flex-col justify-between p-3 transform scale-105 z-10 hover:scale-110 transition-transform cursor-pointer">
                           <div className="absolute top-0 w-full h-1 bg-primary left-0"></div>
                           <span className="text-xs font-bold text-primary tracking-wider">STANDARD</span>
                           <span className="text-xl font-bold text-gray-900">${Math.round(gigs[0]?.base_price * 1.5)}</span>
                        </div>
                        <div className="h-32 bg-gray-50 border border-gray-100 rounded-md flex flex-col justify-between p-3 hover:bg-gray-100 transition-colors cursor-pointer">
                           <span className="text-xs font-semibold text-gray-500 tracking-wider">PREMIUM</span>
                           <span className="text-lg font-bold text-gray-900">${Math.round(gigs[0]?.base_price * 2.5)}</span>
                        </div>
                     </div>
                   </div>
                 ) : null}
               </div>
               <p className="mt-8 text-sm text-gray-500 text-center font-medium">
                  {isLoading ? 'Connecting to APIs...' : 'Interactive 3-Tier Pricing Model'}
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
