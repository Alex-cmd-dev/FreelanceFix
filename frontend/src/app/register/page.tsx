'use client';
import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { updateProfile } from '../../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : 'http://localhost:3001/api';

export default function Register() {
  const router = useRouter();
  const [role, setRole] = useState<'client' | 'freelancer'>('client');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    companyName: '',
    portfolioUrl: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Step 1 — create the user account (POST /api/auth/register)
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Registration failed');
      }

      // Step 2 — sign in via NextAuth to get the backend token into the session
      const signInResult = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (signInResult?.error) throw new Error('Account created but sign-in failed. Please try logging in.');

      // Step 3 — create the role-specific sub-profile (PUT /api/users/profile)
      // getSession() inside fetchAPI will now return the new session set by signIn
      if (role === 'freelancer') {
        await updateProfile({
          role: 'freelancer',
          ...(formData.portfolioUrl ? { portfolio_url: formData.portfolioUrl } : {}),
        });
      } else {
        await updateProfile({
          role: 'client',
          ...(formData.companyName ? { company_name: formData.companyName } : {}),
        });
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex flex-col py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mt-8">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create a new account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <div className="flex justify-center mb-8">
            <div className="bg-gray-100 p-1 rounded-md flex space-x-1 w-full">
              <button
                type="button" onClick={() => setRole('client')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all duration-200 ${role === 'client' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Join as Client
              </button>
              <button
                type="button" onClick={() => setRole('freelancer')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all duration-200 ${role === 'freelancer' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Join as Freelancer
              </button>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-md p-3">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                <input id="firstName" name="firstName" type="text" required value={formData.firstName} onChange={handleChange}
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                <input id="lastName" name="lastName" type="text" required value={formData.lastName} onChange={handleChange}
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
              <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input id="password" name="password" type="password" required minLength={6} value={formData.password} onChange={handleChange}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
            </div>

            {role === 'client' && (
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                  Company Name <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input id="companyName" name="companyName" type="text" value={formData.companyName} onChange={handleChange}
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
              </div>
            )}

            {role === 'freelancer' && (
              <div>
                <label htmlFor="portfolioUrl" className="block text-sm font-medium text-gray-700">
                  Portfolio URL <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input id="portfolioUrl" name="portfolioUrl" type="url" placeholder="https://" value={formData.portfolioUrl} onChange={handleChange}
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
              </div>
            )}

            <div className="pt-2">
              <button type="submit" disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50">
                {isLoading ? 'Creating account…' : `Register as ${role === 'client' ? 'Client' : 'Freelancer'}`}
              </button>
            </div>
          </form>

          <div className="mt-6 flex justify-center border-t border-gray-100 pt-6">
            <Link href="/login" className="text-sm font-medium text-primary hover:text-primary-dark">
              Already have an account? Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
