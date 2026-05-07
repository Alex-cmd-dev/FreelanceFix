'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { getCategories, createGig, createGigPackage } from '../../../lib/api';
import type { CategoryWithSubs, Gig } from '../../../lib/types';

const TIERS = ['Basic', 'Standard', 'Premium'] as const;

type PackageInput = { price: string; description: string; delivery_days: string };

export default function CreateGigPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [categories, setCategories] = useState<CategoryWithSubs[]>([]);
  const [step, setStep] = useState<1 | 2>(1);
  const [createdGig, setCreatedGig] = useState<Gig | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [gigForm, setGigForm] = useState({
    title: '',
    description: '',
    base_price: '',
    category_id: '',
    subcategory_id: '',
  });

  const [packages, setPackages] = useState<Record<string, PackageInput>>({
    Basic: { price: '', description: '', delivery_days: '' },
    Standard: { price: '', description: '', delivery_days: '' },
    Premium: { price: '', description: '', delivery_days: '' },
  });

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  if (status === 'loading') {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-8" />
        <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm space-y-5">
          <div className="h-5 bg-gray-200 rounded w-1/4" />
          <div className="h-10 bg-gray-100 rounded" />
          <div className="h-24 bg-gray-100 rounded" />
          <div className="h-10 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-500">
        <p className="text-lg font-medium">Sign in required</p>
        <p className="text-sm mt-1 mb-4">You must be signed in with a freelancer account to create a gig.</p>
        <Link href="/login" className="bg-primary text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-primary-dark transition-colors">
          Sign In
        </Link>
      </div>
    );
  }

  const subcategories = gigForm.category_id
    ? categories.find((c) => c.id === parseInt(gigForm.category_id))?.subcategories ?? []
    : [];

  const handleGigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const gig = await createGig({
        title: gigForm.title,
        description: gigForm.description,
        base_price: parseFloat(gigForm.base_price),
        subcategory_id: parseInt(gigForm.subcategory_id),
      });
      setCreatedGig(gig);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to create gig. Make sure you have a freelancer profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePackagesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdGig) return;
    setIsSubmitting(true);
    setError('');

    try {
      const toSave = TIERS.filter((t) => packages[t].price && packages[t].description && packages[t].delivery_days);
      if (toSave.length === 0) throw new Error('Add at least one package before saving.');

      await Promise.all(
        toSave.map((tier) =>
          createGigPackage(createdGig.id, {
            tier,
            price: parseFloat(packages[tier].price),
            description: packages[tier].description,
            delivery_days: parseInt(packages[tier].delivery_days),
          }),
        ),
      );
      router.push(`/gigs/${createdGig.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to save packages.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updatePkg = (tier: string, field: keyof PackageInput, value: string) =>
    setPackages((prev) => ({ ...prev, [tier]: { ...prev[tier], [field]: value } }));

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Step indicator */}
      <div className="flex items-center mb-8 gap-4">
        {[{ n: 1, label: 'Gig Details' }, { n: 2, label: 'Packages & Pricing' }].map(({ n, label }) => (
          <div key={n} className="flex items-center gap-2">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-sm font-bold ${step === n ? 'bg-primary text-white' : step > n ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {step > n ? '✓' : n}
            </div>
            <span className={`text-sm font-medium ${step === n ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
            {n < 2 && <div className="h-px w-8 bg-gray-200" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md p-3">{error}</div>
      )}

      {step === 1 && (
        <form onSubmit={handleGigSubmit} className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm space-y-5">
          <h1 className="text-xl font-bold text-gray-900">Create a Gig</h1>

          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text" required value={gigForm.title}
              onChange={(e) => setGigForm({ ...gigForm, title: e.target.value })}
              placeholder="e.g. I will design a professional logo for your business"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              required rows={4} value={gigForm.description}
              onChange={(e) => setGigForm({ ...gigForm, description: e.target.value })}
              placeholder="Describe what you will deliver, your process, and why clients should choose you."
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                required value={gigForm.category_id}
                onChange={(e) => setGigForm({ ...gigForm, category_id: e.target.value, subcategory_id: '' })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary bg-white"
              >
                <option value="">Select…</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Subcategory</label>
              <select
                required value={gigForm.subcategory_id}
                onChange={(e) => setGigForm({ ...gigForm, subcategory_id: e.target.value })}
                disabled={subcategories.length === 0}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary bg-white disabled:opacity-50"
              >
                <option value="">Select…</option>
                {subcategories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Base Price ($)</label>
            <input
              type="number" required min="1" step="0.01" value={gigForm.base_price}
              onChange={(e) => setGigForm({ ...gigForm, base_price: e.target.value })}
              placeholder="50.00"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
            />
          </div>

          <button
            type="submit" disabled={isSubmitting}
            className="w-full py-2 px-4 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Creating…' : 'Continue to Packages'}
          </button>
        </form>
      )}

      {step === 2 && createdGig && (
        <form onSubmit={handlePackagesSubmit} className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm mb-2">
            <h1 className="text-xl font-bold text-gray-900 mb-1">Set Your Packages</h1>
            <p className="text-sm text-gray-500">Fill in at least one tier. Leave blank tiers will be skipped.</p>
          </div>

          {TIERS.map((tier, idx) => {
            const isMiddle = idx === 1;
            return (
              <div key={tier} className={`bg-white border rounded-lg p-5 shadow-sm ${isMiddle ? 'border-primary ring-1 ring-primary' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-gray-900">{tier}</h2>
                  {isMiddle && <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Recommended</span>}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600">Price ($)</label>
                    <input
                      type="number" min="1" step="0.01"
                      value={packages[tier].price}
                      onChange={(e) => updatePkg(tier, 'price', e.target.value)}
                      placeholder="99.00"
                      className="mt-1 w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600">Delivery Days</label>
                    <input
                      type="number" min="1"
                      value={packages[tier].delivery_days}
                      onChange={(e) => updatePkg(tier, 'delivery_days', e.target.value)}
                      placeholder="5"
                      className="mt-1 w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">What&apos;s included</label>
                  <textarea
                    rows={2}
                    value={packages[tier].description}
                    onChange={(e) => updatePkg(tier, 'description', e.target.value)}
                    placeholder="Describe what the client gets at this tier…"
                    className="mt-1 w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
            );
          })}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push(`/gigs/${createdGig.id}`)}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Skip for now
            </button>
            <button
              type="submit" disabled={isSubmitting}
              className="flex-1 py-2 px-4 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving…' : 'Save & Publish'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
