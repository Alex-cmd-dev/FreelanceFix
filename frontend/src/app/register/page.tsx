'use client';
import { useState } from 'react';
import Link from 'next/link';
import { updateProfile } from '../../lib/api';

export default function Register() {
  const [role, setRole] = useState<'client' | 'freelancer'>('client');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    companyName: '',
    portfolioUrl: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Typically you'd call a /register auth endpoint first to get `id`, 
      // but matching the current OpenAPI, we update the profile.
      const payload = role === 'client' 
        ? { company_name: formData.companyName } 
        : { portfolio_url: formData.portfolioUrl };
        
      await updateProfile(payload);
      
    } catch (err: any) {
      setError(err.message || `Failed to register as ${role}. Ensure the backend is active.`);
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
          {/* Role Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-gray-100 p-1 rounded-md flex space-x-1 w-full relative">
               <button 
                type="button"
                onClick={() => setRole('client')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all duration-200 ${role === 'client' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-900'}`}>
                 Join as Client
               </button>
               <button 
                type="button"
                onClick={() => setRole('freelancer')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all duration-200 ${role === 'freelancer' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-900'}`}>
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
                  <div className="mt-1">
                    <input id="firstName" name="firstName" type="text" required value={formData.firstName} onChange={handleChange} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                  </div>
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                  <div className="mt-1">
                    <input id="lastName" name="lastName" type="text" required value={formData.lastName} onChange={handleChange} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                  </div>
                </div>
             </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1">
                <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1">
                <input id="password" name="password" type="password" required value={formData.password} onChange={handleChange} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
              </div>
            </div>
            
            {role === 'client' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Company Name <span className="text-gray-400 font-normal">(Optional)</span></label>
                <div className="mt-1">
                  <input id="companyName" name="companyName" type="text" value={formData.companyName} onChange={handleChange} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
              </div>
            )}

            {role === 'freelancer' && (
               <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label htmlFor="portfolioUrl" className="block text-sm font-medium text-gray-700">Portfolio URL <span className="text-gray-400 font-normal">(Optional)</span></label>
                  <div className="mt-1">
                    <input id="portfolioUrl" name="portfolioUrl" type="url" placeholder="https://" value={formData.portfolioUrl} onChange={handleChange} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                  </div>
               </div>
            )}

            <div className="pt-2">
              <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50">
                {isLoading ? 'Processing...' : `Register as ${role === 'client' ? 'Client' : 'Freelancer'}`}
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
