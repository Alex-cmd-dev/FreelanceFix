'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold tracking-tight text-gray-900">
                freelance <span className="text-primary font-bold">fix</span>
              </span>
            </Link>
            <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
              <Link href="/gigs" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Explore Gigs
              </Link>
              <Link href="/briefs" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Briefs
              </Link>
              {session && (
                <>
                  <Link href="/messages" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Messages
                  </Link>
                  <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Dashboard
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="h-8 w-24 bg-gray-100 rounded animate-pulse" />
            ) : session ? (
              <>
                <span className="text-sm text-gray-600 hidden sm:block">
                  {session.user?.name || session.user?.email}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Sign In
                </Link>
                <Link href="/register" className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
